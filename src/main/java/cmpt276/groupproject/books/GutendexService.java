package cmpt276.groupproject.books;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class GutendexService {

	private final ObjectMapper objectMapper;
	private final String baseUrl;
	private final HttpClient httpClient;

	@Autowired
	public GutendexService(ObjectMapper objectMapper,
			@Value("${gutendex.base-url:https://gutendex.com}") String baseUrl) {
		this(objectMapper, baseUrl, HttpClient.newBuilder()
				.connectTimeout(Duration.ofSeconds(10))
				.followRedirects(HttpClient.Redirect.NORMAL)
				.build());
	}

	GutendexService(ObjectMapper objectMapper, String baseUrl, HttpClient httpClient) {
		this.objectMapper = objectMapper;
		this.baseUrl = baseUrl;
		this.httpClient = httpClient;
	}

	public List<GutendexBook> search(String query) {
		if (query == null || query.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A search query is required.");
		}
		URI uri = UriComponentsBuilder.fromUriString(baseUrl + "/books/")
				.queryParam("search", query.trim())
				.queryParam("languages", "en")
				.build().encode().toUri();
		JsonNode results = request(uri).path("results");
		List<GutendexBook> books = new ArrayList<>();
		if (results.isArray()) {
			results.forEach(result -> {
				GutendexBook book = mapBook(result);
				if (book.textUrl() != null) {
					books.add(book);
				}
			});
		}
		return books;
	}

	public GutendexBook getBook(int gutenbergId) {
		if (gutenbergId <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid Gutenberg book ID is required.");
		}
		return mapBook(request(URI.create(baseUrl + "/books/" + gutenbergId + "/")));
	}

	private JsonNode request(URI uri) {
		HttpRequest request = HttpRequest.newBuilder(uri)
				.timeout(Duration.ofSeconds(20))
				.header("Accept", "application/json")
				.header("User-Agent", "Booksprint school project")
				.GET().build();
		try {
			HttpResponse<String> response = sendWithRetry(request);
			if (response.statusCode() == 404) {
				throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found.");
			}
			if (response.statusCode() < 200 || response.statusCode() >= 300) {
				throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
						"Gutendex request failed with status " + response.statusCode() + ".");
			}
			return objectMapper.readTree(response.body());
		} catch (InterruptedException exception) {
			Thread.currentThread().interrupt();
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Gutendex request was interrupted.", exception);
		} catch (IOException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to reach Gutendex.", exception);
		}
	}

	private HttpResponse<String> sendWithRetry(HttpRequest request) throws IOException, InterruptedException {
		IOException firstFailure;
		try {
			return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
		} catch (IOException exception) {
			firstFailure = exception;
		}

		try {
			return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
		} catch (IOException exception) {
			exception.addSuppressed(firstFailure);
			throw exception;
		}
	}

	private GutendexBook mapBook(JsonNode node) {
		return new GutendexBook(
				node.path("id").asInt(),
				textOr(node, "title", "Untitled"),
				authors(node.path("authors")),
				strings(node.path("subjects")),
				format(node.path("formats"), "image/jpeg"),
				plainTextFormat(node.path("formats")),
				node.path("download_count").asInt(0));
	}

	private List<String> authors(JsonNode array) {
		List<String> names = new ArrayList<>();
		if (array.isArray()) {
			array.forEach(author -> {
				String name = text(author, "name");
				if (name != null) {
					names.add(name);
				}
			});
		}
		return names;
	}

	private List<String> strings(JsonNode array) {
		List<String> values = new ArrayList<>();
		if (array.isArray()) {
			array.forEach(value -> values.add(value.asString()));
		}
		return values;
	}

	private String plainTextFormat(JsonNode formats) {
		String utf8 = format(formats, "text/plain; charset=utf-8");
		if (utf8 != null) {
			return utf8;
		}
		String ascii = format(formats, "text/plain; charset=us-ascii");
		if (ascii != null) {
			return ascii;
		}
		Iterator<Map.Entry<String, JsonNode>> fields = formats.properties().iterator();
		while (fields.hasNext()) {
			Map.Entry<String, JsonNode> field = fields.next();
			if (field.getKey().startsWith("text/plain") && field.getValue().isTextual()) {
				return secureUrl(field.getValue().asText());
			}
		}
		return null;
	}

	private String format(JsonNode formats, String name) {
		JsonNode value = formats.path(name);
		return value.isString() ? secureUrl(value.asString()) : null;
	}

	private String secureUrl(String value) {
		return value.replaceFirst("^http://", "https://");
	}

	private String textOr(JsonNode parent, String field, String fallback) {
		String value = text(parent, field);
		return value == null ? fallback : value;
	}

	private String text(JsonNode parent, String field) {
		JsonNode value = parent.path(field);
		return value.isString() && !value.asString().isBlank() ? value.asString() : null;
	}
}
