package cmpt276.groupproject.models;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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

	private String trim(String value) {
		return value == null ? null : value.trim();
	}

	private String normalizeEmail(String value) {
		String trimmed = trim(value);
		return trimmed == null ? null : trimmed.toLowerCase();
	}
}
