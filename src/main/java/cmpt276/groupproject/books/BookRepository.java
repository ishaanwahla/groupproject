package cmpt276.groupproject.books;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BookRepository extends JpaRepository<Book, Long> {
	Optional<Book> findByGutenbergId(int gutenbergId);
}
