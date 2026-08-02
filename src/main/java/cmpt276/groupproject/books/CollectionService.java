package cmpt276.groupproject.books;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import cmpt276.groupproject.models.UserAccount;

@Service
public class CollectionService {

	private final BookRepository bookRepository;
	private final UserBookRepository userBookRepository;
	private final GutenbergCatalogService catalogService;
	private final GutenbergTextService textService;
	private final Map<String, String[]> wordCache = new ConcurrentHashMap<>();

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
	public TextChunkResponse chunk(UserAccount user, Long userBookId, int startWordIndex, int charsPerLine) {
		if (startWordIndex < 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startWordIndex cannot be negative.");
		}
		if (charsPerLine < 1) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "charsPerLine must be positive.");
		}

		Book book = ownedBook(user, userBookId).getBook();
		String[] words = wordsFor(book);

		if (startWordIndex >= words.length) {
			return new TextChunkResponse(startWordIndex, List.of(), startWordIndex, true);
		}

		int endIndex = packOneLine(words, startWordIndex, charsPerLine);
		String value = String.join(" ", Arrays.copyOfRange(words, startWordIndex, endIndex)) + " ";
		List<String> characters = value.chars().mapToObj(character -> String.valueOf((char) character)).toList();

		return new TextChunkResponse(startWordIndex, characters, endIndex, endIndex >= words.length);
	}

	private String[] wordsFor(Book book) {
		return wordCache.computeIfAbsent(book.getContent(), content -> content.split("\\s+"));
	}

	private int packOneLine(String[] words, int startIndex, int charsPerLine) {
		int length = 0;
		int i = startIndex;
		while (i < words.length) {
			int nextLength = length == 0 ? words[i].length() : length + 1 + words[i].length();
			if (i > startIndex && nextLength > charsPerLine)
				break;
			length = nextLength;
			i++;
		}
		return i;
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
