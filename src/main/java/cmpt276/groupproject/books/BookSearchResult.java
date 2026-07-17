package cmpt276.groupproject.books;

import java.util.List;

public record BookSearchResult(
	int gutenbergId,
	String title,
	List<String> authors,
	List<String> subjects,
	String coverUrl,
	int downloadCount
) {
	public static BookSearchResult from(GutendexBook book) {
		return new BookSearchResult(
			book.gutenbergId(),
			book.title(),
			book.authors(),
			book.subjects(),
			book.coverUrl(),
			book.downloadCount()
		);
	}
}
