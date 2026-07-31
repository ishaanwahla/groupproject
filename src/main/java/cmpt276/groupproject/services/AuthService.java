package cmpt276.groupproject.services;

import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import cmpt276.groupproject.models.LoginRequest;
import cmpt276.groupproject.models.RegisterRequest;
import cmpt276.groupproject.models.TypingStatsRequest;
import cmpt276.groupproject.models.UserAccount;
import cmpt276.groupproject.models.UserAccountRepository;
import cmpt276.groupproject.models.UserRole;
import jakarta.servlet.http.HttpSession;

@Service
public class AuthService {

	public static final String CURRENT_USER_ID = "CURRENT_USER_ID";

	private final UserAccountRepository userAccountRepository;
	private final PasswordHasher passwordHasher;

	public AuthService(UserAccountRepository userAccountRepository, PasswordHasher passwordHasher) {
		this.userAccountRepository = userAccountRepository;
		this.passwordHasher = passwordHasher;
	}

	public UserAccount register(RegisterRequest request, HttpSession session) {
		if (userAccountRepository.existsByEmailIgnoreCase(request.getEmail())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered.");
		}

		UserAccount user = new UserAccount();
		user.setName(request.getName());
		user.setEmail(request.getEmail());
		user.setPasswordHash(passwordHasher.hash(request.getPassword()));
		user.setRole(UserRole.USER);
		UserAccount saved = userAccountRepository.save(user);
		session.setAttribute(CURRENT_USER_ID, saved.getId());
		return saved;
	}

	public UserAccount login(LoginRequest request, HttpSession session) {
		UserAccount user = userAccountRepository.findByEmailIgnoreCase(request.getEmail())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password."));

		if (!passwordHasher.matches(request.getPassword(), user.getPasswordHash())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
		}

		session.setAttribute(CURRENT_USER_ID, user.getId());
		return user;
	}

	public void logout(HttpSession session) {
		session.invalidate();
	}

	public Optional<UserAccount> currentUser(HttpSession session) {
		Object id = session.getAttribute(CURRENT_USER_ID);
		if (!(id instanceof Long userId)) {
			return Optional.empty();
		}
		return userAccountRepository.findById(userId);
	}

	public UserAccount saveTypingStats(UserAccount user, TypingStatsRequest request) {
		user.setLastWpm(request.getWpm());
		user.setLastAccuracy(request.getAccuracy());
		if (request.isCompleted()) {
			if (user.getBestWpm() == null || request.getWpm() > user.getBestWpm()) {
				user.setBestWpm(request.getWpm());
			}
			int sessionsCompleted = user.getSessionsCompleted() == null ? 0 : user.getSessionsCompleted();
			user.setSessionsCompleted(sessionsCompleted + 1);
		}
		return userAccountRepository.save(user);
	}
}
