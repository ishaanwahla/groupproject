package cmpt276.groupproject.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockCookie;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import cmpt276.groupproject.models.UserAccount;
import cmpt276.groupproject.models.UserAccountRepository;
import cmpt276.groupproject.models.UserRole;
import cmpt276.groupproject.services.PasswordHasher;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private UserAccountRepository userAccountRepository;

	@Autowired
	private PasswordHasher passwordHasher;

	@BeforeEach
	void setUp() {
		userAccountRepository.deleteAll();
	}

	@Test
	void registerCreatesUserAndStartsSession() throws Exception {
		MvcResult result = mockMvc.perform(post("/api/auth/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"name":"Ada Lovelace","email":"ada@example.com","password":"password123"}
					"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.name").value("Ada Lovelace"))
			.andExpect(jsonPath("$.email").value("ada@example.com"))
			.andExpect(jsonPath("$.role").value("USER"))
			.andReturn();

		assertThat(userAccountRepository.count()).isEqualTo(1);
		MockCookie sessionCookie = sessionCookie(result);

		mockMvc.perform(get("/api/auth/me").cookie(sessionCookie))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.email").value("ada@example.com"))
			.andReturn();
	}

	@Test
	void registerRejectsDuplicateEmail() throws Exception {
		userAccountRepository.save(user("Ada", "ada@example.com", "password123", UserRole.USER));

		mockMvc.perform(post("/api/auth/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"name":"Ada Two","email":"ada@example.com","password":"password123"}
					"""))
			.andExpect(status().isConflict());
	}

	@Test
	void loginRejectsWrongPassword() throws Exception {
		userAccountRepository.save(user("Ada", "ada@example.com", "password123", UserRole.USER));

		mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"email":"ada@example.com","password":"wrongpassword"}
					"""))
			.andExpect(status().isUnauthorized());
	}

	@Test
	void loginAndLogoutManageCurrentSession() throws Exception {
		userAccountRepository.save(user("Ada", "ada@example.com", "password123", UserRole.USER));

		MvcResult result = mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"email":"ada@example.com","password":"password123"}
					"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.email").value("ada@example.com"))
			.andReturn();
		MockCookie sessionCookie = sessionCookie(result);

		mockMvc.perform(get("/api/auth/me").cookie(sessionCookie))
			.andExpect(status().isOk());

		mockMvc.perform(post("/api/auth/logout").cookie(sessionCookie))
			.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/auth/me").cookie(sessionCookie))
			.andExpect(status().isUnauthorized());
	}

	@Test
	void adminUsersRequiresLogin() throws Exception {
		mockMvc.perform(get("/api/admin/users"))
			.andExpect(status().isUnauthorized());
	}

	@Test
	void adminUsersRejectsStandardUser() throws Exception {
		userAccountRepository.save(user("Ada", "ada@example.com", "password123", UserRole.USER));
		MockCookie sessionCookie = login("ada@example.com", "password123");

		mockMvc.perform(get("/api/admin/users").cookie(sessionCookie))
			.andExpect(status().isForbidden());
	}

	@Test
	void adminUsersListsAccountsWithoutPasswordHashes() throws Exception {
		userAccountRepository.save(user("Admin", "admin@example.com", "password123", UserRole.ADMIN));
		userAccountRepository.save(user("Ada", "ada@example.com", "password123", UserRole.USER));
		MockCookie sessionCookie = login("admin@example.com", "password123");

		mockMvc.perform(get("/api/admin/users").cookie(sessionCookie))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$", hasSize(2)))
			.andExpect(jsonPath("$[0].passwordHash").doesNotExist())
			.andExpect(jsonPath("$[1].passwordHash").doesNotExist());
	}

	private MockCookie login(String email, String password) throws Exception {
		MvcResult result = mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"email":"%s","password":"%s"}
					""".formatted(email, password)))
			.andExpect(status().isOk())
			.andReturn();
		return sessionCookie(result);
	}

	private MockCookie sessionCookie(MvcResult result) {
		return (MockCookie) result.getResponse().getCookie("SESSION");
	}

	private UserAccount user(String name, String email, String password, UserRole role) {
		UserAccount user = new UserAccount();
		user.setName(name);
		user.setEmail(email);
		user.setPasswordHash(passwordHasher.hash(password));
		user.setRole(role);
		return user;
	}
}
