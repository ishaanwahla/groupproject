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
	@Test
	void returnsTwentyWordChunksForAnOwnedBook() {
		UserBookRepository userBookRepository = mock(UserBookRepository.class);
		CollectionService service = new CollectionService(mock(BookRepository.class), userBookRepository,
			mock(GutendexService.class), mock(GutenbergTextService.class));
		UserAccount user = new UserAccount();
		user.setId(7L);
		Book book = new Book();
		book.setContent(IntStream.rangeClosed(1, 45).mapToObj(index -> "word" + index)
			.collect(Collectors.joining(" ")));
		book.setTotalWords(45);
		UserBook userBook = new UserBook();
		userBook.setUser(user);
		userBook.setBook(book);
		when(userBookRepository.findByIdAndUserId(12L, 7L)).thenReturn(Optional.of(userBook));

		TextChunkResponse response = service.chunk(user, 12L, 1);

		String expected = IntStream.rangeClosed(21, 40).mapToObj(index -> "word" + index)
			.collect(Collectors.joining(" ")) + " ";
		assertThat(String.join("", response.text())).isEqualTo(expected);
		assertThat(response.text()).allMatch(character -> character.length() == 1);
		assertThat(response.nextWordIndex()).isEqualTo(40);
		assertThat(response.endOfBook()).isFalse();
	}

	@Test
	void doesNotMoveSavedProgressBackwards() {
		UserBookRepository userBookRepository = mock(UserBookRepository.class);
		CollectionService service = new CollectionService(mock(BookRepository.class), userBookRepository,
			mock(GutendexService.class), mock(GutenbergTextService.class));
		UserAccount user = new UserAccount();
		user.setId(7L);
		Book book = new Book();
		book.setTotalWords(100);
		UserBook userBook = new UserBook();
		userBook.setUser(user);
		userBook.setBook(book);
		userBook.setCurrentWordIndex(40);
		when(userBookRepository.findByIdAndUserId(12L, 7L)).thenReturn(Optional.of(userBook));
		when(userBookRepository.save(userBook)).thenReturn(userBook);

		CollectionBookResponse response = service.updateProgress(user, 12L, 25);

		assertThat(response.currentWordIndex()).isEqualTo(40);
	}
}
