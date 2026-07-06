package cmpt276.groupproject.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import cmpt276.groupproject.services.AuthService;
import jakarta.servlet.http.HttpSession;

@Controller
public class PageController {
	private final AuthService authService;

	public PageController(AuthService authService) {
		this.authService = authService;
	}

	@GetMapping("/")
	public String home() {
		return "redirect:/login";
	}

	@GetMapping("/app")
	public String index(HttpSession session) {
		if (authService.currentUser(session).isEmpty()) {
			return "redirect:/login";
		}
		return "index";
	}

	@GetMapping("/login")
	public String login() {
		return "login";
	}

	@GetMapping("/register")
	public String register() {
		return "register";
	}

	@GetMapping("/admin")
	public String admin(HttpSession session) {
		boolean isAdmin = authService.currentUser(session)
				.map(user -> user.isAdmin())
				.orElse(false);

		if (!isAdmin) {
			return "redirect:/login";
		}
		return "admin";
	}
}
