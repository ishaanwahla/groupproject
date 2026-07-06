package cmpt276.groupproject.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import cmpt276.groupproject.models.LoginRequest;
import cmpt276.groupproject.models.RegisterRequest;
import cmpt276.groupproject.models.UserAccount;
import cmpt276.groupproject.models.UserResponse;
import cmpt276.groupproject.services.AuthService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	public UserResponse register(@Valid @RequestBody RegisterRequest request, BindingResult bindingResult,
		HttpSession session) {
		if (bindingResult.hasErrors()) {
			FieldError error = bindingResult.getFieldError();
			String message = error == null ? "Registration data is invalid." : error.getDefaultMessage();
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
		}

		UserAccount user = authService.register(request, session);
		return UserResponse.from(user);
	}

	@PostMapping("/login")
	public UserResponse login(@Valid @RequestBody LoginRequest request, BindingResult bindingResult,
		HttpSession session) {
		if (bindingResult.hasErrors()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Login data is invalid.");
		}

		return UserResponse.from(authService.login(request, session));
	}

	@PostMapping("/logout")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void logout(HttpSession session) {
		authService.logout(session);
	}

	@GetMapping("/me")
	public UserResponse me(HttpSession session) {
		return authService.currentUser(session)
			.map(UserResponse::from)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required."));
	}
}
