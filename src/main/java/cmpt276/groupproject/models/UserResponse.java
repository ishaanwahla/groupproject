package cmpt276.groupproject.models;

import java.time.LocalDateTime;
import java.util.List;

public record UserResponse(Long id, String name, String email, UserRole role, LocalDateTime createdAt,
		LocalDateTime updatedAt, Integer lastWpm, Integer lastAccuracy, Integer bestWpm,
		Integer sessionsCompleted, List<String> bookTitles, String favoriteBookTitle) {

	public static UserResponse from(UserAccount userAccount) {
		return from(userAccount, List.of(), null);
	}

	public static UserResponse from(UserAccount userAccount, List<String> bookTitles, String favoriteBookTitle) {
		return new UserResponse(
			userAccount.getId(),
			userAccount.getName(),
			userAccount.getEmail(),
			userAccount.getRole(),
			userAccount.getCreatedAt(),
			userAccount.getUpdatedAt(),
			userAccount.getLastWpm(),
			userAccount.getLastAccuracy(),
			userAccount.getBestWpm(),
			userAccount.getSessionsCompleted(),
			bookTitles,
			favoriteBookTitle
		);
	}
}
