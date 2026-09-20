package in.tutorlink.repository; import in.tutorlink.entity.*; import org.springframework.data.jpa.repository.*; import java.util.*;
public interface NotificationRepository extends JpaRepository<Notification,Long>{ List<Notification> findByUserIdOrderByCreatedAtDesc(Long id); }
