package cmpt276.groupproject.books;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;

import org.junit.jupiter.api.Test;

class GutenbergTextServiceTest {
	// Makes sure the Gutenberg legal notes, header, and footer are removed
	@Test
	void removesGutenbergHeaderFooterAndNormalizesWhitespace() throws IOException {
		String raw = """
				Project Gutenberg metadata
				*** START OF THE PROJECT GUTENBERG EBOOK FRANKENSTEIN ***

				Chapter One
				The story begins.

				*** END OF THE PROJECT GUTENBERG EBOOK FRANKENSTEIN ***
				License text
				""";

		String cleaned = new GutenbergTextService().clean(raw);

		assertThat(cleaned).isEqualTo("Chapter One The story begins.");
	}

	// Makes sure the title and ToC are skipped before the real book
	// starts
	@Test
	void skipsTitleAndContentsBeforeRepeatedFirstSection() throws IOException {
		String raw = """
				*** START OF THE PROJECT GUTENBERG EBOOK FRANKENSTEIN ***

				Frankenstein;
				or, the Modern Prometheus
				by Mary Wollstonecraft Shelley

				CONTENTS
				Letter 1
				Letter 2
				Chapter 1

				Letter 1
				To Mrs. Saville, England.
				You will rejoice to hear that no disaster has accompanied the commencement.

				*** END OF THE PROJECT GUTENBERG EBOOK FRANKENSTEIN ***
				""";

		String cleaned = new GutenbergTextService().clean(raw);

		assertThat(cleaned).isEqualTo(
				"Letter 1 To Mrs. Saville, England. You will rejoice to hear that no disaster has accompanied the commencement.");
	}
}
