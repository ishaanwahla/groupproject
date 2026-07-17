package cmpt276.groupproject.books;

import java.util.List;

public record BookSearchResult(
	int gutenbergId,
	String title,
	List<String> authors,
	String coverUrl
) {
	public static BookSearchResult from(GutenbergBook book) {
		return new BookSearchResult(
			book.gutenbergId(),
			book.title(),
			book.authors(),
			book.coverUrl()
		);
	}
}
