package cmpt276.groupproject.books;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.junit.jupiter.api.Test;

import cmpt276.groupproject.models.UserAccount;

class CollectionServiceTest {

	private Book bookOfWords(int count) {
		Book book = new Book();
		book.setContent(IntStream.rangeClosed(1, count)
				.mapToObj(index -> String.format("w%03d", index))
				.collect(Collectors.joining(" ")));
		book.setTotalWords(count);
		return book;
	}

	@Test
	void packsWordsUpToTheCharsPerLineBoundary() {
		UserBookRepository userBookRepository = mock(UserBookRepository.class);
		CollectionService service = new CollectionService(mock(BookRepository.class), userBookRepository,
				mock(GutenbergCatalogService.class), mock(GutenbergTextService.class));
		UserAccount user = new UserAccount();
		user.setId(7L);
		Book book = bookOfWords(10);
		UserBook userBook = new UserBook();
		userBook.setUser(user);
		userBook.setBook(book);
		when(userBookRepository.findByIdAndUserId(12L, 7L)).thenReturn(Optional.of(userBook));

		// starting at word index 3 ("w004"): w004(4) + w005(+5=9) + w006(+5=14) fits
		// exactly at 14; w007 would push to 19, so it must NOT be included
		TextChunkResponse response = service.chunk(user, 12L, 3, 14);

		assertThat(String.join("", response.text())).isEqualTo("w004 w005 w006 ");
		assertThat(response.text()).allMatch(character -> character.length() == 1);
		assertThat(response.nextWordIndex()).isEqualTo(6);
		assertThat(response.endOfBook()).isFalse();
	}

	// A single word longer than charsPerLine must still be returned alone on its
	// own
	// line rather than producing an empty chunk or looping forever
	@Test
	void placesAnOversizedWordAloneOnItsOwnLine() {
		UserBookRepository userBookRepository = mock(UserBookRepository.class);
		CollectionService service = new CollectionService(mock(BookRepository.class), userBookRepository,
				mock(GutenbergCatalogService.class), mock(GutenbergTextService.class));
		UserAccount user = new UserAccount();
		user.setId(7L);
		Book book = bookOfWords(3);
		UserBook userBook = new UserBook();
		userBook.setUser(user);
		userBook.setBook(book);
		when(userBookRepository.findByIdAndUserId(12L, 7L)).thenReturn(Optional.of(userBook));

		// "w001" is 4 characters, well over a budget of 1
		TextChunkResponse response = service.chunk(user, 12L, 0, 1);

		assertThat(String.join("", response.text())).isEqualTo("w001 ");
		assertThat(response.nextWordIndex()).isEqualTo(1);
		assertThat(response.endOfBook()).isFalse();
	}

	// Confirms the last line of a book is packed correctly and endOfBook flips true
	// exactly when there are no words left, not one line early or late
	@Test
	void marksEndOfBookOnceTheFinalWordIsPacked() {
		UserBookRepository userBookRepository = mock(UserBookRepository.class);
		CollectionService service = new CollectionService(mock(BookRepository.class), userBookRepository,
				mock(GutenbergCatalogService.class), mock(GutenbergTextService.class));
		UserAccount user = new UserAccount();
		user.setId(7L);
		Book book = bookOfWords(5);
		UserBook userBook = new UserBook();
		userBook.setUser(user);
		userBook.setBook(book);
		when(userBookRepository.findByIdAndUserId(12L, 7L)).thenReturn(Optional.of(userBook));

		// budget of 100 is generous enough to swallow every remaining word in one line
		TextChunkResponse response = service.chunk(user, 12L, 2, 100);

		assertThat(String.join("", response.text())).isEqualTo("w003 w004 w005 ");
		assertThat(response.nextWordIndex()).isEqualTo(5);
		assertThat(response.endOfBook()).isTrue();
	}

	// Makes sure an older update cannot move the user's progress backwards
	@Test
	void doesNotMoveSavedProgressBackwards() {
		UserBookRepository userBookRepository = mock(UserBookRepository.class);
		CollectionService service = new CollectionService(mock(BookRepository.class), userBookRepository,
				mock(GutenbergCatalogService.class), mock(GutenbergTextService.class));
		UserAccount user = new UserAccount();
		user.setId(7L);
		Book book = new Book();
		book.setTotalWords(100);
		UserBook userBook = new UserBook();
		userBook.setUser(user);
		userBook.setBook(book);
		userBook.setCurrentWordIndex(40);
		when(userBookRepository.findByIdAndUserIdForUpdate(12L, 7L)).thenReturn(Optional.of(userBook));
		when(userBookRepository.save(userBook)).thenReturn(userBook);

		CollectionBookResponse response = service.updateProgress(user, 12L, 25);

		assertThat(response.currentWordIndex()).isEqualTo(40);
	}
}
