package cmpt276.groupproject.books;

import java.util.List;

public record GutenbergBook(
	int gutenbergId,
	String title,
	List<String> authors,
	List<String> subjects,
	String coverUrl,
	String textUrl
) {}
