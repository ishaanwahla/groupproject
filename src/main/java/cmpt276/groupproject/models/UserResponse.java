package cmpt276.groupproject.models;

import java.time.LocalDateTime;

public record UserResponse(Long id, String name, String email, UserRole role, LocalDateTime createdAt,
		Integer lastWpm, Integer lastAccuracy) {

	public static UserResponse from(UserAccount userAccount) {
		return new UserResponse(
			userAccount.getId(),
			userAccount.getName(),
			userAccount.getEmail(),
			userAccount.getRole(),
			userAccount.getCreatedAt(),
			userAccount.getLastWpm(),
			userAccount.getLastAccuracy()
		);
	}
}
