package cmpt276.groupproject.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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

import cmpt276.groupproject.books.Book;
import cmpt276.groupproject.books.BookRepository;
import cmpt276.groupproject.books.UserBook;
import cmpt276.groupproject.books.UserBookRepository;
import cmpt276.groupproject.models.UserAccount;
import cmpt276.groupproject.models.UserAccountRepository;
import cmpt276.groupproject.models.UserRole;
import cmpt276.groupproject.services.PasswordHasher;

@SpringBootTest
@AutoConfigureMockMvc
class AdminControllerTest {

	private static final String PASSWORD = "password123";

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private UserAccountRepository userAccountRepository;

	@Autowired
	private BookRepository bookRepository;

	@Autowired
	private UserBookRepository userBookRepository;

	@Autowired
	private PasswordHasher passwordHasher;

	@BeforeEach
	void setUp() {
		userBookRepository.deleteAll();
		bookRepository.deleteAll();
		userAccountRepository.deleteAll();
	}

	@Test
	void adminUsersRequiresLogin() throws Exception {
		mockMvc.perform(get("/api/admin/users"))
			.andExpect(status().isUnauthorized());
	}

	@Test
	void adminUsersRejectsStandardUser() throws Exception {
		user("Ada", "ada@example.com", UserRole.USER);
		MockCookie sessionCookie = login("ada@example.com");

		mockMvc.perform(get("/api/admin/users").cookie(sessionCookie))
			.andExpect(status().isForbidden());
	}

	@Test
	void adminUsersListsBookTitlesForUserWithCollection() throws Exception {
		user("Admin", "admin@example.com", UserRole.ADMIN);
		UserAccount ada = user("Ada", "ada@example.com", UserRole.USER);
		addBookToCollection(ada, "Alice in Wonderland");
		addBookToCollection(ada, "The Time Machine");
		MockCookie sessionCookie = login("admin@example.com");

		// findAllByOrderByCreatedAtDescIdDesc lists the most recently created user first, so Ada is index 0.
		// findBookTitlesByUserId orders by updatedAt desc, so the most recently added book is index 0.
		mockMvc.perform(get("/api/admin/users").cookie(sessionCookie))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].email").value("ada@example.com"))
			.andExpect(jsonPath("$[0].bookTitles[0]").value("The Time Machine"))
			.andExpect(jsonPath("$[0].bookTitles[1]").value("Alice in Wonderland"));
	}

	@Test
	void adminUsersReturnsEmptyBookListForUserWithNoCollection() throws Exception {
		user("Admin", "admin@example.com", UserRole.ADMIN);
		user("Ada", "ada@example.com", UserRole.USER);
		MockCookie sessionCookie = login("admin@example.com");

		mockMvc.perform(get("/api/admin/users").cookie(sessionCookie))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].email").value("ada@example.com"))
			.andExpect(jsonPath("$[0].bookTitles").isEmpty());
	}

	@Test
	void adminUsersIncludesFavoriteBookTitle() throws Exception {
		user("Admin", "admin@example.com", UserRole.ADMIN);
		UserAccount ada = user("Ada", "ada@example.com", UserRole.USER);
		addBookToCollection(ada, "Alice in Wonderland", false);
		addBookToCollection(ada, "The Time Machine", true);
		MockCookie sessionCookie = login("admin@example.com");

		mockMvc.perform(get("/api/admin/users").cookie(sessionCookie))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].email").value("ada@example.com"))
			.andExpect(jsonPath("$[0].favoriteBookTitle").value("The Time Machine"));
	}

	@Test
	void adminUsersReturnsNullFavoriteBookTitleWhenNoneFavorited() throws Exception {
		user("Admin", "admin@example.com", UserRole.ADMIN);
		UserAccount ada = user("Ada", "ada@example.com", UserRole.USER);
		addBookToCollection(ada, "Alice in Wonderland");
		MockCookie sessionCookie = login("admin@example.com");

		mockMvc.perform(get("/api/admin/users").cookie(sessionCookie))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].email").value("ada@example.com"))
			.andExpect(jsonPath("$[0].favoriteBookTitle").value(nullValue()));
	}

	@Test
	void adminUsersIncludesMemberSinceAndLastActive() throws Exception {
		user("Admin", "admin@example.com", UserRole.ADMIN);
		user("Ada", "ada@example.com", UserRole.USER);
		MockCookie sessionCookie = login("admin@example.com");

		mockMvc.perform(get("/api/admin/users").cookie(sessionCookie))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].email").value("ada@example.com"))
			.andExpect(jsonPath("$[0].createdAt").exists())
			.andExpect(jsonPath("$[0].updatedAt").exists());
	}

	@Test
	void lastActiveReflectsMostRecentTypingStatsSave() throws Exception {
		UserAccount ada = user("Ada", "ada@example.com", UserRole.USER);
		MockCookie sessionCookie = login("ada@example.com");

		mockMvc.perform(post("/api/typing/stats")
				.cookie(sessionCookie)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"wpm":50,"accuracy":90}
					"""))
			.andExpect(status().isNoContent());

		UserAccount reloaded = userAccountRepository.findById(ada.getId()).orElseThrow();
		assertThat(reloaded.getUpdatedAt()).isAfterOrEqualTo(ada.getUpdatedAt());
	}

	@Test
	void deleteUserRequiresLogin() throws Exception {
		UserAccount ada = user("Ada", "ada@example.com", UserRole.USER);

		mockMvc.perform(delete("/api/admin/users/" + ada.getId()))
			.andExpect(status().isUnauthorized());
	}

	@Test
	void deleteUserRejectsStandardUser() throws Exception {
		UserAccount ada = user("Ada", "ada@example.com", UserRole.USER);
		MockCookie sessionCookie = login("ada@example.com");

		mockMvc.perform(delete("/api/admin/users/" + ada.getId()).cookie(sessionCookie))
			.andExpect(status().isForbidden());
	}

	@Test
	void deleteUserRejectsDeletingOwnAccount() throws Exception {
		UserAccount admin = user("Admin", "admin@example.com", UserRole.ADMIN);
		MockCookie sessionCookie = login("admin@example.com");

		mockMvc.perform(delete("/api/admin/users/" + admin.getId()).cookie(sessionCookie))
			.andExpect(status().isBadRequest());
		assertThat(userAccountRepository.findById(admin.getId())).isPresent();
	}

	@Test
	void deleteUserReturnsNotFoundForUnknownId() throws Exception {
		user("Admin", "admin@example.com", UserRole.ADMIN);
		MockCookie sessionCookie = login("admin@example.com");

		mockMvc.perform(delete("/api/admin/users/999999").cookie(sessionCookie))
			.andExpect(status().isNotFound());
	}

	@Test
	void deleteUserRemovesAccountAndCollection() throws Exception {
		user("Admin", "admin@example.com", UserRole.ADMIN);
		UserAccount ada = user("Ada", "ada@example.com", UserRole.USER);
		addBookToCollection(ada, "Alice in Wonderland");
		MockCookie sessionCookie = login("admin@example.com");

		mockMvc.perform(delete("/api/admin/users/" + ada.getId()).cookie(sessionCookie))
			.andExpect(status().isNoContent());

		assertThat(userAccountRepository.findById(ada.getId())).isEmpty();
		assertThat(userBookRepository.findAllByUserIdOrderByUpdatedAtDesc(ada.getId())).isEmpty();
	}

	private void addBookToCollection(UserAccount user, String title) {
		addBookToCollection(user, title, false);
	}

	private void addBookToCollection(UserAccount user, String title, boolean favorite) {
		Book book = new Book();
		book.setGutenbergId(bookRepository.findAll().size() + 1);
		book.setTitle(title);
		book.setAuthors("Author");
		book.setSubjects("Subject");
		book.setContent("placeholder content");
		book.setTotalWords(2);
		bookRepository.save(book);

		UserBook userBook = new UserBook();
		userBook.setUser(user);
		userBook.setBook(book);
		userBook.setFavorite(favorite);
		userBookRepository.save(userBook);
	}

	private UserAccount user(String name, String email, UserRole role) {
		UserAccount user = new UserAccount();
		user.setName(name);
		user.setEmail(email);
		user.setPasswordHash(passwordHasher.hash(PASSWORD));
		user.setRole(role);
		return userAccountRepository.save(user);
	}

	private MockCookie login(String email) throws Exception {
		MvcResult result = mockMvc.perform(post("/api/auth/login")
				.param("email", email)
				.param("password", PASSWORD))
			.andReturn();
		return (MockCookie) result.getResponse().getCookie("SESSION");
	}
}
