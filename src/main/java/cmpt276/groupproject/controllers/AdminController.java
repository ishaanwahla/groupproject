package cmpt276.groupproject.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import cmpt276.groupproject.books.UserBookRepository;
import cmpt276.groupproject.models.UserAccount;
import cmpt276.groupproject.models.UserAccountRepository;
import cmpt276.groupproject.models.UserResponse;
import cmpt276.groupproject.services.AuthService;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

	private final AuthService authService;
	private final UserAccountRepository userAccountRepository;
	private final UserBookRepository userBookRepository;

	public AdminController(AuthService authService, UserAccountRepository userAccountRepository,
			UserBookRepository userBookRepository) {
		this.authService = authService;
		this.userAccountRepository = userAccountRepository;
		this.userBookRepository = userBookRepository;
	}

	@GetMapping("/users")
	public List<UserResponse> users(HttpSession session) {
		UserAccount currentUser = authService.currentUser(session)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required."));
		if (!currentUser.isAdmin()) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required.");
		}

		return userAccountRepository.findAllByOrderByCreatedAtDescIdDesc()
			.stream()
			.map(user -> UserResponse.from(user, userBookRepository.findBookTitlesByUserId(user.getId())))
			.toList();
	}
}
