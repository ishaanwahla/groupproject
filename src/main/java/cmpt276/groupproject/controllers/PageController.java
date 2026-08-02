package cmpt276.groupproject.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import cmpt276.groupproject.models.LoginRequest;
import cmpt276.groupproject.models.RegisterRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import cmpt276.groupproject.services.AuthService;
import cmpt276.groupproject.books.CollectionService;
import jakarta.servlet.http.HttpSession;

@Controller
public class PageController {
	private final AuthService authService;
	private final CollectionService collectionService;

	public PageController(AuthService authService, CollectionService collectionService) {
		this.authService = authService;
		this.collectionService = collectionService;
	}

	@GetMapping("/")
	public String home(HttpSession session) {
		var currentUser = authService.currentUser(session);

		if (currentUser.isPresent()) {
			return currentUser.get().isAdmin() ? "redirect:/admin" : "redirect:/app";
		}

		return "redirect:/login";
	}

	@GetMapping("/app")
	public String index(@RequestParam(required = false) Long book, HttpSession session) {
		var currentUser = authService.currentUser(session);

		if (currentUser.isEmpty()) {
			return "redirect:/login";
		}

		if (currentUser.get().isAdmin()) {
			return "redirect:/admin";
		}

		if (book == null) {
			session.removeAttribute("currentBookId");
		} else {
			session.setAttribute("currentBookId", book);
		}
		return "index";
	}

	@GetMapping("/collection")
	public String collection(HttpSession session) {
		if (authService.currentUser(session).isEmpty()) {
			return "redirect:/login";
		}
		return "collection";
	}

	@GetMapping("/discover")
	public String discover(HttpSession session) {
		if (authService.currentUser(session).isEmpty()) {
			return "redirect:/login";
		}
		return "discover";
	}

	@GetMapping("/profile")
	public String profile(HttpSession session, Model model) {
		var currentUser = authService.currentUser(session);
		if (currentUser.isEmpty()) {
			return "redirect:/login";
		}
		model.addAttribute("user", currentUser.get());
		model.addAttribute("favoriteBook", collectionService.favorite(currentUser.get()));
		return "profile";
	}

	@GetMapping("/login")
	public String login(Model model, HttpSession session) {
		var currentUser = authService.currentUser(session);
		if (currentUser.isPresent()) {
			return currentUser.get().isAdmin() ? "redirect:/admin" : "redirect:/app";
		}

		model.addAttribute("loginRequest", new LoginRequest());
		return "login";
	}

	@GetMapping("/register")
	public String register(Model model) {
		model.addAttribute("registerRequest", new RegisterRequest());
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
