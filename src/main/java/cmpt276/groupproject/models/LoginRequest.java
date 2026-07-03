package cmpt276.groupproject.models;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class LoginRequest {

	@NotBlank(message = "Email is required.")
	@Email(message = "Email must be valid.")
	@Size(max = 120, message = "Email must be 120 characters or fewer.")
	private String email;

	@NotBlank(message = "Password is required.")
	private String password;

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = trim(email);
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	private String trim(String value) {
		return value == null ? null : value.trim();
	}
}
