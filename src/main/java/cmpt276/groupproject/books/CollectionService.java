package cmpt276.groupproject.books;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import cmpt276.groupproject.models.UserAccount;

@Service
public class CollectionService {

	private static final int CHUNK_SIZE = 20; // the number of words per chunk

	private final BookRepository bookRepository;
	private final UserBookRepository userBookRepository;
	private final GutenbergCatalogService catalogService;
	private final GutenbergTextService textService;

	public CollectionService(BookRepository bookRepository, UserBookRepository userBookRepository,
			GutenbergCatalogService catalogService, GutenbergTextService textService) {
		this.bookRepository = bookRepository;
		this.userBookRepository = userBookRepository;
		this.catalogService = catalogService;
		this.textService = textService;
	}

	@Transactional(readOnly = true)
	public List<CollectionBookResponse> list(UserAccount user) {
		return userBookRepository.findAllByUserIdOrderByUpdatedAtDesc(user.getId())
			.stream().map(CollectionBookResponse::from).toList();
	}

	@Transactional
	public CollectionBookResponse add(UserAccount user, int gutenbergId) {
		return userBookRepository.findByUserIdAndBookGutenbergId(user.getId(), gutenbergId)
			.map(CollectionBookResponse::from)
			.orElseGet(() -> createCollectionBook(user, gutenbergId));
	}

	@Transactional
	public CollectionBookResponse updateProgress(UserAccount user, Long userBookId, int wordIndex) {
		UserBook userBook = userBookRepository.findByIdAndUserIdForUpdate(userBookId, user.getId())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Collection book not found."));
		int newWordIndex = Math.min(Math.max(0, wordIndex), userBook.getBook().getTotalWords());
		userBook.setCurrentWordIndex(Math.max(userBook.getCurrentWordIndex(), newWordIndex));
		return CollectionBookResponse.from(userBookRepository.save(userBook));
	}

	@Transactional(readOnly = true)
	// Params: chunkId - an integer representing a place in the blob of text we are grabbing from
	// Returns: an object in the form { chunkId: chunkId, text: [...]} where "text" is an array of individual characters
	public TextChunkResponse chunk(UserAccount user, Long userBookId, int chunkId) {
		if (chunkId < 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chunk ID cannot be negative.");
		}
		Book book = ownedBook(user, userBookId).getBook();
		String[] words = book.getContent().split("\\s+");
		int start = Math.min(words.length, chunkId * CHUNK_SIZE);
		int end = Math.min(words.length, start + CHUNK_SIZE);
		// temporarily "reattach" the words
		// then break them up into individual characters
		String value = start == end ? "" : String.join(" ", Arrays.copyOfRange(words, start, end)) + " ";
		List<String> characters = value.chars().mapToObj(character -> String.valueOf((char) character)).toList();
		return new TextChunkResponse(chunkId, characters, end, end >= words.length);
	}

	private CollectionBookResponse createCollectionBook(UserAccount user, int gutenbergId) {
		Book book = bookRepository.findByGutenbergId(gutenbergId).orElseGet(() -> importBook(gutenbergId));
		UserBook userBook = new UserBook();
		userBook.setUser(user);
		userBook.setBook(book);
		return CollectionBookResponse.from(userBookRepository.save(userBook));
	}

	private Book importBook(int gutenbergId) {
		GutenbergBook source = catalogService.getBook(gutenbergId);
		if (source.textUrl() == null) {
			throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT,
				"This book does not provide plain text.");
		}
		try {
			String content = textService.download(source.textUrl());
			Book book = new Book();
			book.setGutenbergId(source.gutenbergId());
			book.setTitle(source.title());
			book.setAuthors(String.join("|", source.authors()));
			book.setSubjects(String.join("|", source.subjects()));
			book.setCoverUrl(source.coverUrl());
			book.setContent(content);
			book.setTotalWords(content.split("\\s+").length);
			return bookRepository.save(book);
		} catch (InterruptedException exception) {
			Thread.currentThread().interrupt();
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Book download was interrupted.", exception);
		} catch (IOException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to download book text.", exception);
		}
	}

	private UserBook ownedBook(UserAccount user, Long userBookId) {
		return userBookRepository.findByIdAndUserId(userBookId, user.getId())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Collection book not found."));
	}
}
