package cmpt276.groupproject.books;

import java.io.IOException;
import java.io.StringReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;

@Service
public class GutenbergCatalogService {

	private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(8);
	private static final String USER_AGENT =
			"Booksprint/1.0 (+https://github.com/ishaanwahla/groupproject)";
	private static final Pattern BOOK_ID = Pattern.compile("/ebooks/(\\d+)\\.opds$");
	private static final Pattern DOWNLOAD_COUNT = Pattern.compile("\\d[\\d,]* downloads?", Pattern.CASE_INSENSITIVE);

	private final String baseUrl;
	private final String textBaseUrl;
	private final HttpClient httpClient;

	@Autowired
	public GutenbergCatalogService(
			@Value("${gutenberg.catalog-base-url:https://www.gutenberg.org}") String baseUrl,
			@Value("${gutenberg.text-base-url:https://gutenberg.pglaf.org}") String textBaseUrl) {
		this(baseUrl, textBaseUrl, HttpClient.newBuilder()
				.connectTimeout(Duration.ofSeconds(5))
				.followRedirects(HttpClient.Redirect.NORMAL)
				.build());
	}

	GutenbergCatalogService(String baseUrl, String textBaseUrl, HttpClient httpClient) {
		this.baseUrl = baseUrl;
		this.textBaseUrl = textBaseUrl;
		this.httpClient = httpClient;
	}

	public List<GutenbergBook> search(String query) {
		if (query == null || query.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A search query is required.");
		}
		URI uri = UriComponentsBuilder.fromUriString(baseUrl + "/ebooks/search.opds/")
				.queryParam("query", query.trim())
				.build().encode().toUri();
		return parseSearch(request(uri));
	}

	public GutenbergBook getBook(int gutenbergId) {
		if (gutenbergId <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid Gutenberg book ID is required.");
		}
		return parseBook(request(URI.create(baseUrl + "/ebooks/" + gutenbergId + ".opds")), gutenbergId);
	}

	private String request(URI uri) {
		HttpRequest request = HttpRequest.newBuilder(uri)
				.timeout(REQUEST_TIMEOUT)
				.header("Accept", "application/atom+xml")
				.header("User-Agent", USER_AGENT)
				.GET().build();
		try {
			HttpResponse<String> response = httpClient.send(request,
				HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
			if (response.statusCode() == 404) {
				throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found.");
			}
			if (response.statusCode() < 200 || response.statusCode() >= 300) {
				throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
					"Project Gutenberg catalog request failed with status " + response.statusCode() + ".");
			}
			return response.body();
		} catch (InterruptedException exception) {
			Thread.currentThread().interrupt();
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
				"Project Gutenberg catalog request was interrupted.", exception);
		} catch (IOException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
				"Unable to reach the Project Gutenberg catalog.", exception);
		}
	}

	private List<GutenbergBook> parseSearch(String xml) {
		List<GutenbergBook> books = new ArrayList<>();
		NodeList entries = parse(xml).getElementsByTagNameNS("*", "entry");
		for (int i = 0; i < entries.getLength(); i++) {
			Element entry = (Element) entries.item(i);
			Integer gutenbergId = bookId(text(entry, "id"));
			if (gutenbergId == null) {
				continue;
			}
			String author = text(entry, "content");
			List<String> authors = author == null || DOWNLOAD_COUNT.matcher(author).matches()
				? List.of() : List.of(author);
			books.add(new GutenbergBook(
				gutenbergId,
				title(entry),
				authors,
				List.of(),
				coverUrl(gutenbergId),
				textUrl(gutenbergId)
			));
		}
		return books;
	}

	private GutenbergBook parseBook(String xml, int gutenbergId) {
		NodeList entries = parse(xml).getElementsByTagNameNS("*", "entry");
		if (entries.getLength() == 0) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
				"Project Gutenberg returned no book metadata.");
		}

		Element entry = (Element) entries.item(0);
		String coverUrl = null;
		boolean textBook = false;
		List<String> subjects = new ArrayList<>();

		NodeList categories = entry.getElementsByTagNameNS("*", "category");
		for (int i = 0; i < categories.getLength(); i++) {
			Element category = (Element) categories.item(i);
			String scheme = category.getAttribute("scheme");
			String term = category.getAttribute("term");
			if (scheme.endsWith("/LCSH") && !term.isBlank()) {
				subjects.add(term);
			}
			if (scheme.endsWith("/DCMIType") && "Text".equals(term)) {
				textBook = true;
			}
		}

		NodeList links = entry.getElementsByTagNameNS("*", "link");
		for (int i = 0; i < links.getLength(); i++) {
			Element link = (Element) links.item(i);
			if ("http://opds-spec.org/image".equals(link.getAttribute("rel"))) {
				coverUrl = link.getAttribute("href");
				break;
			}
		}

		return new GutenbergBook(
			gutenbergId,
			title(entry),
			authors(entry),
			subjects,
			coverUrl == null || coverUrl.isBlank() ? coverUrl(gutenbergId) : coverUrl,
			textBook ? textUrl(gutenbergId) : null
		);
	}

	private Document parse(String xml) {
		try {
			DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
			factory.setNamespaceAware(true);
			factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
			factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
			factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
			return factory.newDocumentBuilder().parse(new InputSource(new StringReader(xml)));
		} catch (ParserConfigurationException | SAXException | IOException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
				"Project Gutenberg returned invalid catalog data.", exception);
		}
	}

	private List<String> authors(Element entry) {
		List<String> authors = new ArrayList<>();
		NodeList authorElements = entry.getElementsByTagNameNS("*", "author");
		for (int i = 0; i < authorElements.getLength(); i++) {
			String name = text((Element) authorElements.item(i), "name");
			if (name != null) {
				authors.add(name);
			}
		}
		return authors;
	}

	private String title(Element entry) {
		String title = text(entry, "title");
		return title == null ? "Untitled" : title;
	}

	private String text(Element parent, String elementName) {
		NodeList elements = parent.getElementsByTagNameNS("*", elementName);
		if (elements.getLength() == 0) {
			return null;
		}
		String value = elements.item(0).getTextContent().trim();
		return value.isBlank() ? null : value;
	}

	private Integer bookId(String identifier) {
		if (identifier == null) {
			return null;
		}
		Matcher matcher = BOOK_ID.matcher(identifier.trim());
		return matcher.find() ? Integer.valueOf(matcher.group(1)) : null;
	}

	private String coverUrl(int gutenbergId) {
		return baseUrl + "/cache/epub/" + gutenbergId + "/pg" + gutenbergId + ".cover.medium.jpg";
	}

	private String textUrl(int gutenbergId) {
		return textBaseUrl + "/cache/epub/" + gutenbergId + "/pg" + gutenbergId + ".txt";
	}
}
