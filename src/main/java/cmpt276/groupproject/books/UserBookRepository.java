package cmpt276.groupproject.books;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import jakarta.persistence.LockModeType;

public interface UserBookRepository extends JpaRepository<UserBook, Long> {
	List<UserBook> findAllByUserIdOrderByUpdatedAtDesc(Long userId);
	Optional<UserBook> findByIdAndUserId(Long id, Long userId);
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select userBook from UserBook userBook where userBook.id = ?1 and userBook.user.id = ?2")
	Optional<UserBook> findByIdAndUserIdForUpdate(Long id, Long userId);
	Optional<UserBook> findByUserIdAndBookGutenbergId(Long userId, int gutenbergId);
	@Query("select userBook.book.title from UserBook userBook where userBook.user.id = ?1 order by userBook.updatedAt desc")
	List<String> findBookTitlesByUserId(Long userId);
}
