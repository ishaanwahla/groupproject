package cmpt276.groupproject.models;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapKeyColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "user_accounts")
public class UserAccount {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@NotBlank(message = "Name is required.")
	@Size(min = 2, max = 80, message = "Name must be between 2 and 80 characters.")
	@Column(nullable = false, length = 80)
	private String name;

	@NotBlank(message = "Email is required.")
	@Email(message = "Email must be valid.")
	@Size(max = 120, message = "Email must be 120 characters or fewer.")
	@Column(nullable = false, length = 120, unique = true)
	private String email;

	@NotBlank(message = "Password hash is required.")
	@Column(nullable = false, length = 128)
	private String passwordHash;

	@NotNull(message = "Role is required.")
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private UserRole role = UserRole.USER;

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(nullable = false)
	private LocalDateTime updatedAt;

	private Integer lastWpm;

	private Integer lastAccuracy;

	private Integer bestWpm;

	private Integer sessionsCompleted;

	private Integer lastWordsTyped;

	private Integer lastMistakes;

	private Integer totalWpm;

	private Integer totalAccuracy;

	private Integer totalWordsTyped;

	private Integer totalMistakes;

	@ElementCollection(fetch = FetchType.EAGER)
	@CollectionTable(name = "user_mistake_counts", joinColumns = @JoinColumn(name = "user_id"))
	@MapKeyColumn(name = "mistake_key", length = 8)
	@Column(name = "mistake_count", nullable = false)
	private Map<String, Integer> mistakeCounts = new HashMap<>();

	@PrePersist
	void onCreate() {
		LocalDateTime now = LocalDateTime.now();
		createdAt = now;
		updatedAt = now;
	}

	@PreUpdate
	void onUpdate() {
		updatedAt = LocalDateTime.now();
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = trim(name);
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = normalizeEmail(email);
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public void setPasswordHash(String passwordHash) {
		this.passwordHash = passwordHash;
	}

	public UserRole getRole() {
		return role;
	}

	public void setRole(UserRole role) {
		this.role = role;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}

	public boolean isAdmin() {
		return role == UserRole.ADMIN;
	}

	public Integer getLastWpm() {
		return lastWpm;
	}

	public void setLastWpm(Integer lastWpm) {
		this.lastWpm = lastWpm;
	}

	public Integer getLastAccuracy() {
		return lastAccuracy;
	}

	public void setLastAccuracy(Integer lastAccuracy) {
		this.lastAccuracy = lastAccuracy;
	}

	public Integer getBestWpm() {
		return bestWpm;
	}

	public void setBestWpm(Integer bestWpm) {
		this.bestWpm = bestWpm;
	}

	public Integer getSessionsCompleted() {
		return sessionsCompleted;
	}

	public void setSessionsCompleted(Integer sessionsCompleted) {
		this.sessionsCompleted = sessionsCompleted;
	}

	public Integer getLastWordsTyped() {
		return lastWordsTyped;
	}

	public void setLastWordsTyped(Integer lastWordsTyped) {
		this.lastWordsTyped = lastWordsTyped;
	}

	public Integer getLastMistakes() {
		return lastMistakes;
	}

	public void setLastMistakes(Integer lastMistakes) {
		this.lastMistakes = lastMistakes;
	}

	public Integer getTotalWpm() {
		return totalWpm;
	}

	public void setTotalWpm(Integer totalWpm) {
		this.totalWpm = totalWpm;
	}

	public Integer getTotalAccuracy() {
		return totalAccuracy;
	}

	public void setTotalAccuracy(Integer totalAccuracy) {
		this.totalAccuracy = totalAccuracy;
	}

	public Integer getTotalWordsTyped() {
		return totalWordsTyped;
	}

	public void setTotalWordsTyped(Integer totalWordsTyped) {
		this.totalWordsTyped = totalWordsTyped;
	}

	public Integer getTotalMistakes() {
		return totalMistakes;
	}

	public void setTotalMistakes(Integer totalMistakes) {
		this.totalMistakes = totalMistakes;
	}

	public Map<String, Integer> getMistakeCounts() {
		return mistakeCounts;
	}

	public String getMostMissedKey() {
		return mistakeCounts.entrySet().stream()
			.filter(entry -> entry.getValue() != null && entry.getValue() > 0)
			.sorted(Map.Entry.<String, Integer>comparingByValue(Comparator.reverseOrder())
				.thenComparing(Map.Entry.comparingByKey()))
			.map(Map.Entry::getKey)
			.findFirst()
			.orElse(null);
	}

	public String getMostMissedKeyDisplay() {
		String key = getMostMissedKey();
		if (key == null) return null;
		if (" ".equals(key)) return "Space";
		return key.toUpperCase(Locale.ROOT);
	}

	public Integer getMostMissedKeyCount() {
		String key = getMostMissedKey();
		return key == null ? null : mistakeCounts.get(key);
	}

	public Integer getAverageWpm() {
		if (totalWpm == null || sessionsCompleted == null || sessionsCompleted == 0) return null;
		return Math.round((float) totalWpm / sessionsCompleted);
	}

	public Integer getAverageAccuracy() {
		if (totalAccuracy == null || sessionsCompleted == null || sessionsCompleted == 0) return null;
		return Math.round((float) totalAccuracy / sessionsCompleted);
	}

	private String trim(String value) {
		return value == null ? null : value.trim();
	}

	private String normalizeEmail(String value) {
		String trimmed = trim(value);
		return trimmed == null ? null : trimmed.toLowerCase();
	}
}
