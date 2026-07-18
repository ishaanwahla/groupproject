package cmpt276.groupproject.books;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

class GutenbergCatalogServiceTest {
	private HttpServer server;
	private GutenbergCatalogService service;

	@BeforeEach
	void setUp() throws IOException {
		server = HttpServer.create(new InetSocketAddress(0), 0);
		server.createContext("/ebooks/search.opds/", exchange -> respond(exchange, searchFeed()));
		server.createContext("/ebooks/84.opds", exchange -> respond(exchange, bookFeed("Text")));
		server.createContext("/ebooks/999.opds", exchange -> respond(exchange, bookFeed("Sound")));
		server.start();
		service = new GutenbergCatalogService(
				"http://localhost:" + server.getAddress().getPort(),
				"https://gutenberg.pglaf.org", HttpClient.newHttpClient());
	}

	@AfterEach
	void tearDown() {
		server.stop(0);
	}

	@Test
	void searchMapsOnlyBookEntries() {
		GutenbergBook book = service.search("frankenstein").get(0);

		assertThat(book.gutenbergId()).isEqualTo(84);
		assertThat(book.title()).isEqualTo("Frankenstein");
		assertThat(book.authors()).containsExactly("Shelley, Mary Wollstonecraft");
		assertThat(book.coverUrl()).endsWith("/cache/epub/84/pg84.cover.medium.jpg");
		assertThat(book.textUrl()).isEqualTo("https://gutenberg.pglaf.org/cache/epub/84/pg84.txt");
	}

	// Makes sure we get the book metadata and plain text link
	@Test
	void getBookMapsMetadataAndPlainTextUrl() {
		GutenbergBook book = service.getBook(84);

		assertThat(book.title()).isEqualTo("Frankenstein");
		assertThat(book.authors()).containsExactly("Shelley, Mary Wollstonecraft");
		assertThat(book.subjects()).containsExactly("Gothic fiction");
		assertThat(book.coverUrl()).isEqualTo("https://www.gutenberg.org/cache/epub/84/pg84.cover.medium.jpg");
		assertThat(book.textUrl()).isEqualTo("https://gutenberg.pglaf.org/cache/epub/84/pg84.txt");
	}

	// Makes sure non-text entries do not get a plain text link
	@Test
	void doesNotOfferPlainTextForNonTextEntries() {
		assertThat(service.getBook(999).textUrl()).isNull();
	}

	private String searchFeed() {
		return """
				<?xml version="1.0" encoding="utf-8"?>
				<feed xmlns="http://www.w3.org/2005/Atom">
				  <entry>
				    <id>https://www.gutenberg.org/ebooks/subjects/search.opds/?query=frankenstein</id>
				    <title>Subjects</title>
				    <content type="text">One subject heading matches your search.</content>
				  </entry>
				  <entry>
				    <id>https://www.gutenberg.org/ebooks/84.opds</id>
				    <title>Frankenstein</title>
				    <content type="text">Shelley, Mary Wollstonecraft</content>
				  </entry>
				</feed>
				""";
	}

	private String bookFeed(String type) {
		return """
				<?xml version="1.0" encoding="utf-8"?>
				<feed xmlns="http://www.w3.org/2005/Atom">
				  <author><name>Project Gutenberg</name></author>
				  <entry>
				    <title>Frankenstein</title>
				    <author><name>Shelley, Mary Wollstonecraft</name></author>
				    <category scheme="http://purl.org/dc/terms/LCSH" term="Gothic fiction"/>
				    <category scheme="http://purl.org/dc/terms/DCMIType" term="%s"/>
				    <link type="image/jpeg" rel="http://opds-spec.org/image"
				          href="https://www.gutenberg.org/cache/epub/84/pg84.cover.medium.jpg"/>
				  </entry>
				</feed>
				""".formatted(type);
	}

	private void respond(HttpExchange exchange, String bodyText) throws IOException {
		byte[] body = bodyText.getBytes(StandardCharsets.UTF_8);
		exchange.getResponseHeaders().add("Content-Type", "application/atom+xml; charset=utf-8");
		exchange.sendResponseHeaders(200, body.length);
		exchange.getResponseBody().write(body);
		exchange.close();
	}
}
