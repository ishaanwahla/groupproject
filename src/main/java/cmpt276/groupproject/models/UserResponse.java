package cmpt276.groupproject.models;

import java.time.LocalDateTime;
import java.util.List;

public record UserResponse(Long id, String name, String email, UserRole role, LocalDateTime createdAt,
		Integer lastWpm, Integer lastAccuracy, List<String> bookTitles) {

	public static UserResponse from(UserAccount userAccount) {
		return from(userAccount, List.of());
	}

	public static UserResponse from(UserAccount userAccount, List<String> bookTitles) {
		return new UserResponse(
			userAccount.getId(),
			userAccount.getName(),
			userAccount.getEmail(),
			userAccount.getRole(),
			userAccount.getCreatedAt(),
			userAccount.getLastWpm(),
			userAccount.getLastAccuracy(),
			bookTitles
		);
	}
}
