package cmpt276.groupproject.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import cmpt276.groupproject.models.UserAccount;
import cmpt276.groupproject.models.UserAccountRepository;
import cmpt276.groupproject.models.UserRole;

@Component
public class AdminUserSeeder implements CommandLineRunner {

	private final UserAccountRepository userAccountRepository;
	private final PasswordHasher passwordHasher;
	private final String adminEmail;
	private final String adminPassword;

	public AdminUserSeeder(UserAccountRepository userAccountRepository, PasswordHasher passwordHasher,
		@Value("${booksprint.admin.email:admin@booksprint.local}") String adminEmail,
		@Value("${booksprint.admin.password:AdminPass123}") String adminPassword) {
		this.userAccountRepository = userAccountRepository;
		this.passwordHasher = passwordHasher;
		this.adminEmail = adminEmail;
		this.adminPassword = adminPassword;
	}

	@Override
	public void run(String... args) {
		if (userAccountRepository.existsByEmailIgnoreCase(adminEmail)) {
			return;
		}

		UserAccount admin = new UserAccount();
		admin.setName("Booksprint Admin");
		admin.setEmail(adminEmail);
		admin.setPasswordHash(passwordHasher.hash(adminPassword));
		admin.setRole(UserRole.ADMIN);
		userAccountRepository.save(admin);
	}
}
