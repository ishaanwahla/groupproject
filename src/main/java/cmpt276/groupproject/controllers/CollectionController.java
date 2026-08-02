package cmpt276.groupproject.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import cmpt276.groupproject.books.AddBookRequest;
import cmpt276.groupproject.books.CollectionBookResponse;
import cmpt276.groupproject.books.CollectionService;
import cmpt276.groupproject.books.ProgressRequest;
import cmpt276.groupproject.books.TextChunkResponse;
import cmpt276.groupproject.models.UserAccount;
import cmpt276.groupproject.services.AuthService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/collection")
public class CollectionController {

	private final CollectionService collectionService;
	private final AuthService authService;

	public CollectionController(CollectionService collectionService, AuthService authService) {
		this.collectionService = collectionService;
		this.authService = authService;
	}

	@GetMapping
	public List<CollectionBookResponse> list(HttpSession session) {
		return collectionService.list(currentUser(session));
	}

	@PostMapping
	public CollectionBookResponse add(@Valid @RequestBody AddBookRequest request, HttpSession session) {
		return collectionService.add(currentUser(session), request.gutenbergId());
	}

	@GetMapping("/{id}/chunks")
	public TextChunkResponse chunk(@PathVariable Long id,
			@RequestParam(defaultValue = "0") int startWordIndex,
			@RequestParam int charsPerLine,
			HttpSession session) {
		return collectionService.chunk(currentUser(session), id, startWordIndex, charsPerLine);
	}

	@PatchMapping("/{id}/progress")
	public CollectionBookResponse progress(@PathVariable Long id, @Valid @RequestBody ProgressRequest request,
			HttpSession session) {
		return collectionService.updateProgress(currentUser(session), id, request.currentWordIndex());
	}

	private UserAccount currentUser(HttpSession session) {
		return authService.currentUser(session)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required."));
	}
}
