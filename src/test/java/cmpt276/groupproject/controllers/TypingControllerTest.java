package cmpt276.groupproject.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
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
class TypingControllerTest {

	private static final String PASSWORD = "password123";

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
	void saveStatsRequiresLogin() throws Exception {
		mockMvc.perform(post("/api/typing/stats")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"wpm":50,"accuracy":90}
					"""))
			.andExpect(status().isUnauthorized());
	}

	@Test
	void saveStatsRejectsNegativeWpm() throws Exception {
		user("Ada", "ada@example.com");
		MockCookie sessionCookie = login("ada@example.com");

		mockMvc.perform(post("/api/typing/stats")
				.cookie(sessionCookie)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"wpm":-5,"accuracy":90}
					"""))
			.andExpect(status().isBadRequest());
	}

	@Test
	void saveStatsPersistsLatestValueForLoggedInUser() throws Exception {
		UserAccount ada = user("Ada", "ada@example.com");
		MockCookie sessionCookie = login("ada@example.com");

		mockMvc.perform(post("/api/typing/stats")
				.cookie(sessionCookie)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"wpm":50,"accuracy":90}
					"""))
			.andExpect(status().isNoContent());

		mockMvc.perform(post("/api/typing/stats")
				.cookie(sessionCookie)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"wpm":85,"accuracy":97}
					"""))
			.andExpect(status().isNoContent());

		UserAccount reloaded = userAccountRepository.findById(ada.getId()).orElseThrow();
		assertThat(reloaded.getLastWpm()).isEqualTo(85);
		assertThat(reloaded.getLastAccuracy()).isEqualTo(97);
	}

	@Test
	void completedSessionsUpdateOverallStats() throws Exception {
		UserAccount ada = user("Ada", "ada@example.com");
		MockCookie sessionCookie = login("ada@example.com");

		saveCompletedStats(sessionCookie, 85, 97, 50, 6, "{\"e\":4,\"x\":2}");
		saveCompletedStats(sessionCookie, 70, 93, 30, 4, "{\"x\":4}");

		UserAccount reloaded = userAccountRepository.findById(ada.getId()).orElseThrow();
		assertThat(reloaded.getBestWpm()).isEqualTo(85);
		assertThat(reloaded.getSessionsCompleted()).isEqualTo(2);
		assertThat(reloaded.getLastWordsTyped()).isEqualTo(30);
		assertThat(reloaded.getLastMistakes()).isEqualTo(4);
		assertThat(reloaded.getAverageWpm()).isEqualTo(78);
		assertThat(reloaded.getAverageAccuracy()).isEqualTo(95);
		assertThat(reloaded.getTotalWordsTyped()).isEqualTo(80);
		assertThat(reloaded.getTotalMistakes()).isEqualTo(10);
		assertThat(reloaded.getMostMissedKey()).isEqualTo("x");
		assertThat(reloaded.getMostMissedKeyCount()).isEqualTo(6);
	}

	@Test
	void profileDisplaysSavedTypingStats() throws Exception {
		user("Ada", "ada@example.com");
		MockCookie sessionCookie = login("ada@example.com");
		saveCompletedStats(sessionCookie, 85, 97, 45, 6, "{\"e\":4,\"x\":2}");
		saveCompletedStats(sessionCookie, 70, 93, 30, 4, "{\"x\":4}");

		mockMvc.perform(get("/profile").cookie(sessionCookie))
			.andExpect(status().isOk())
			.andExpect(content().string(containsString("Latest Session")))
			.andExpect(content().string(containsString("Overall Statistics")))
			.andExpect(content().string(containsString("Overall Accuracy")))
			.andExpect(content().string(containsString("--accuracy: 95%")))
			.andExpect(content().string(containsString(">30</strong><span>Words typed</span>")))
			.andExpect(content().string(containsString(">4</strong><span>Mistakes</span>")))
			.andExpect(content().string(containsString(">85</strong><span>Personal best</span>")))
			.andExpect(content().string(containsString(">78</strong><span>Average WPM</span>")))
			.andExpect(content().string(containsString(">X</strong><span>Most missed key</span>")))
			.andExpect(content().string(containsString(">6</strong><span>Times missed</span>")))
			.andExpect(content().string(containsString(">2</strong><span>Sessions</span>")));
	}

	private UserAccount user(String name, String email) {
		UserAccount user = new UserAccount();
		user.setName(name);
		user.setEmail(email);
		user.setPasswordHash(passwordHasher.hash(PASSWORD));
		user.setRole(UserRole.USER);
		return userAccountRepository.save(user);
	}

	private MockCookie login(String email) throws Exception {
		MvcResult result = mockMvc.perform(post("/api/auth/login")
				.param("email", email)
				.param("password", PASSWORD))
			.andReturn();
		return (MockCookie) result.getResponse().getCookie("SESSION");
	}

	private void saveCompletedStats(MockCookie sessionCookie, int wpm, int accuracy,
			int wordsTyped, int mistakes) throws Exception {
		saveCompletedStats(sessionCookie, wpm, accuracy, wordsTyped, mistakes, "{}");
	}

	private void saveCompletedStats(MockCookie sessionCookie, int wpm, int accuracy,
			int wordsTyped, int mistakes, String mistakeCounts) throws Exception {
		mockMvc.perform(post("/api/typing/stats")
				.cookie(sessionCookie)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"wpm":%d,"accuracy":%d,"completed":true,"wordsTyped":%d,"mistakes":%d,"mistakeCounts":%s}
					""".formatted(wpm, accuracy, wordsTyped, mistakes, mistakeCounts)))
			.andExpect(status().isNoContent());
	}
}
