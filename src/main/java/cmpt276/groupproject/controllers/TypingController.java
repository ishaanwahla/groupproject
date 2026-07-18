package cmpt276.groupproject.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import cmpt276.groupproject.models.TypingStatsRequest;
import cmpt276.groupproject.models.UserAccount;
import cmpt276.groupproject.services.AuthService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/typing")
public class TypingController {

	private final AuthService authService;

	public TypingController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/stats")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void saveStats(@Valid @RequestBody TypingStatsRequest request, HttpSession session) {
		UserAccount currentUser = authService.currentUser(session)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required."));

		authService.saveTypingStats(currentUser, request);
	}
}
