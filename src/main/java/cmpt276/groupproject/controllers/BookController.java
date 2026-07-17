package cmpt276.groupproject.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import cmpt276.groupproject.books.BookSearchResult;
import cmpt276.groupproject.books.GutendexService;
import cmpt276.groupproject.services.AuthService;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/books")
public class BookController {

	private final GutendexService gutendexService;
	private final AuthService authService;

	public BookController(GutendexService gutendexService, AuthService authService) {
		this.gutendexService = gutendexService;
		this.authService = authService;
	}

	@GetMapping("/search")
	public List<BookSearchResult> search(@RequestParam String q, HttpSession session) {
		if (authService.currentUser(session).isEmpty()) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required.");
		}
		return gutendexService.search(q).stream().map(BookSearchResult::from).toList();
	}
}
