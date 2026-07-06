package cmpt276.groupproject.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.ModelAndView;

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

	@PostMapping("/login")
	public Object login(@Valid @ModelAttribute LoginRequest request, BindingResult bindingResult, HttpSession session) {
		if (bindingResult.hasErrors()) {
			return new ModelAndView("login");
		}

		try {
			UserAccount user = authService.login(request, session);
			return user.isAdmin() ? "redirect:/admin" : "redirect:/app";
		} catch (Exception e) {
			bindingResult.reject("loginError", "Incorrect email or password.");
			return new ModelAndView("login");
		}
	}

	@PostMapping("/register")
	public Object register(@Valid @ModelAttribute RegisterRequest request, BindingResult bindingResult,
			HttpSession session) {
		if (bindingResult.hasErrors()) {
			return new ModelAndView("register");
		}

		try {
			authService.register(request, session);
			return "redirect:/app";
		} catch (ResponseStatusException e) {
			bindingResult.rejectValue("email", "registrationError", e.getReason());
			return new ModelAndView("register");
		} catch (Exception e) {
			bindingResult.reject("registrationError", "Unable to create account. Please try again.");
			return new ModelAndView("register");
		}
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
