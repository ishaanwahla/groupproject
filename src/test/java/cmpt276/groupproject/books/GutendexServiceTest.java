package cmpt276.groupproject.books;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import tools.jackson.databind.ObjectMapper;

class GutendexServiceTest {
	private HttpServer server;
	private GutendexService service;

	@BeforeEach
	void setUp() throws IOException {
		server = HttpServer.create(new InetSocketAddress(0), 0);
		server.createContext("/books/", this::respond);
		server.start();
		service = new GutendexService(new ObjectMapper(),
			"http://localhost:" + server.getAddress().getPort(), java.net.http.HttpClient.newHttpClient());
	}

	@AfterEach
	void tearDown() { server.stop(0); }

	@Test
	void searchMapsOnlyBooksWithPlainText() {
		GutendexBook book = service.search("frankenstein").get(0);

		assertThat(book.gutenbergId()).isEqualTo(84);
		assertThat(book.title()).isEqualTo("Frankenstein");
		assertThat(book.authors()).containsExactly("Shelley, Mary Wollstonecraft");
		assertThat(book.coverUrl()).endsWith("cover.jpg");
		assertThat(book.textUrl()).endsWith("84.txt.utf-8");
	}

	private void respond(HttpExchange exchange) throws IOException {
		String json = """
			{"results":[
			  {"id":84,"title":"Frankenstein","authors":[{"name":"Shelley, Mary Wollstonecraft"}],
			   "subjects":["Gothic fiction"],"download_count":100,
			   "formats":{"image/jpeg":"https://example.test/cover.jpg",
			              "text/plain; charset=utf-8":"https://www.gutenberg.org/ebooks/84.txt.utf-8"}},
			  {"id":999,"title":"No text","authors":[],"subjects":[],"formats":{"text/html":"https://example.test"}}
			]}
			""";
		byte[] body = json.getBytes(StandardCharsets.UTF_8);
		exchange.sendResponseHeaders(200, body.length);
		exchange.getResponseBody().write(body);
		exchange.close();
	}
}
