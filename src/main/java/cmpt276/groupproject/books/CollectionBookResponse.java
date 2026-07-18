package cmpt276.groupproject.books;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

public record CollectionBookResponse(
	Long id,
	int gutenbergId,
	String title,
	List<String> authors,
	List<String> subjects,
	String coverUrl,
	int currentWordIndex,
	int totalWords,
	int progressPercent,
	LocalDateTime updatedAt
) {
	public static CollectionBookResponse from(UserBook userBook) {
		Book book = userBook.getBook();
		int progress = book.getTotalWords() == 0 ? 0
			: Math.min(100, (int) Math.round(userBook.getCurrentWordIndex() * 100.0 / book.getTotalWords()));
		return new CollectionBookResponse(
			userBook.getId(),
			book.getGutenbergId(),
			book.getTitle(),
			split(book.getAuthors()),
			split(book.getSubjects()),
			book.getCoverUrl(),
			userBook.getCurrentWordIndex(),
			book.getTotalWords(),
			progress,
			userBook.getUpdatedAt()
		);
	}

	private static List<String> split(String value) {
		return value == null || value.isBlank() ? List.of() : Arrays.asList(value.split("\\|", -1));
	}
}
