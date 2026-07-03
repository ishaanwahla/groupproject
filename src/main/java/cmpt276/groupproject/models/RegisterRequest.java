package cmpt276.groupproject.models;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterRequest {

	@NotBlank(message = "Name is required.")
	@Size(min = 2, max = 80, message = "Name must be between 2 and 80 characters.")
	private String name;

	@NotBlank(message = "Email is required.")
	@Email(message = "Email must be valid.")
	@Size(max = 120, message = "Email must be 120 characters or fewer.")
	private String email;

	@NotBlank(message = "Password is required.")
	@Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters.")
	private String password;

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
