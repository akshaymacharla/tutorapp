package in.tutorlink.repository; import in.tutorlink.entity.*; import org.springframework.data.jpa.repository.*; import java.util.*;
public interface TutorProfileRepository extends JpaRepository<TutorProfile,Long>{ Optional<TutorProfile> findByUserId(Long id); }
