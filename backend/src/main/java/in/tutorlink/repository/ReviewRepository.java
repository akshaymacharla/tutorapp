package in.tutorlink.repository; import in.tutorlink.entity.*; import org.springframework.data.jpa.repository.*; import java.util.*;
public interface ReviewRepository extends JpaRepository<Review,Long>{ boolean existsByActiveTuitionId(Long id); List<Review> findByTutorId(Long id); List<Review> findByTutorIdOrderByCreatedAtDesc(Long id); }
