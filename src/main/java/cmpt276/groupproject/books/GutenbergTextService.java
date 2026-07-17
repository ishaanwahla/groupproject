package cmpt276.groupproject.books;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

@Service
public class GutenbergTextService {

	private static final int MAX_TEXT_BYTES = 10 * 1024 * 1024;
	private static final Set<String> ALLOWED_HOSTS = Set.of("gutenberg.org", "www.gutenberg.org");

	// These markers help omit/skip ToC and legal notes of a book
	private static final Pattern START_MARKER = Pattern.compile(
			"(?is)\\*{3}\\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK.*?\\*{3}");
	private static final Pattern END_MARKER = Pattern.compile(
			"(?is)\\*{3}\\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK.*");
	private static final Pattern CONTENTS_HEADING = Pattern.compile(
			"(?im)^[\\t ]*(?:table of )?contents\\.?[\\t ]*$");
	private static final Pattern NON_EMPTY_LINE = Pattern.compile(
			"(?m)^[\\t ]*(\\S(?:.*\\S)?)[\\t ]*$");

	private final HttpClient httpClient = HttpClient.newBuilder()
			.connectTimeout(Duration.ofSeconds(10))
			.followRedirects(HttpClient.Redirect.NEVER)
			.build();

	public String download(String textUrl) throws IOException, InterruptedException {
		URI uri = URI.create(textUrl);
		validate(uri);
		HttpResponse<byte[]> response = fetch(uri);
		if (response.body().length > MAX_TEXT_BYTES) {
			throw new IOException("Book text exceeds the supported size.");
		}
		return clean(new String(response.body(), java.nio.charset.StandardCharsets.UTF_8));
	}

	private HttpResponse<byte[]> fetch(URI initialUri) throws IOException, InterruptedException {
		URI uri = initialUri;
		for (int redirects = 0; redirects <= 3; redirects++) {
			HttpRequest request = HttpRequest.newBuilder(uri)
					.timeout(Duration.ofSeconds(30))
					.header("Accept", "text/plain")
					.header("User-Agent", "Booksprint school project")
					.GET().build();
			HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
			if (response.statusCode() >= 300 && response.statusCode() < 400) {
				String location = response.headers().firstValue("Location")
						.orElseThrow(() -> new IOException("Project Gutenberg redirect had no destination."));
				URI next = uri.resolve(location);
				if ("http".equalsIgnoreCase(next.getScheme())) {
					next = URI.create(next.toString().replaceFirst("^http://", "https://"));
				}
				validate(next);
				uri = next;
				continue;
			}
			if (response.statusCode() < 200 || response.statusCode() >= 300) {
				throw new IOException("Project Gutenberg download failed with status " + response.statusCode() + ".");
			}
			return response;
		}
		throw new IOException("Project Gutenberg redirected too many times.");
	}

	private void validate(URI uri) throws IOException {
		if (!"https".equalsIgnoreCase(uri.getScheme()) || !ALLOWED_HOSTS.contains(uri.getHost())) {
			throw new IOException("Book text URL is not a trusted Project Gutenberg URL.");
		}
	}

	// Fetching the book from the Gutendex API starts the book and ends it with
	// legal text and ToC which we cut off here
	String clean(String rawText) throws IOException {
		Matcher start = START_MARKER.matcher(rawText);
		String withoutHeader = start.find() ? rawText.substring(start.end()) : rawText;
		String withoutFooter = END_MARKER.matcher(withoutHeader).replaceFirst("");
		String withoutFrontMatter = skipRepeatedContents(withoutFooter);
		String cleaned = withoutFrontMatter.replaceAll("\\s+", " ").trim();
		if (cleaned.isBlank()) {
			throw new IOException("Book text was empty after cleanup.");
		}
		return cleaned;
	}

	private String skipRepeatedContents(String text) {
		Matcher contents = CONTENTS_HEADING.matcher(text);
		if (!contents.find()) {
			return text;
		}

		Matcher firstEntry = NON_EMPTY_LINE.matcher(text);
		firstEntry.region(contents.end(), text.length());
		if (!firstEntry.find()) {
			return text;
		}

		Pattern repeatedHeading = Pattern.compile(
				"(?mi)^[\\t ]*" + Pattern.quote(firstEntry.group(1)) + "[\\t ]*$");
		Matcher narrativeStart = repeatedHeading.matcher(text);
		narrativeStart.region(firstEntry.end(), text.length());
		return narrativeStart.find() ? text.substring(narrativeStart.start()) : text;
	}
}
