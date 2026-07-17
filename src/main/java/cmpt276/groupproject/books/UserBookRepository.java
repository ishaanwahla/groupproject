package cmpt276.groupproject.books;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserBookRepository extends JpaRepository<UserBook, Long> {
	List<UserBook> findAllByUserIdOrderByUpdatedAtDesc(Long userId);
	Optional<UserBook> findByIdAndUserId(Long id, Long userId);
	Optional<UserBook> findByUserIdAndBookGutenbergId(Long userId, int gutenbergId);
}
