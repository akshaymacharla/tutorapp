package in.tutorlink.repository; import in.tutorlink.entity.*; import org.springframework.data.jpa.repository.*; import java.util.*;
public interface ApplicationRepository extends JpaRepository<Application,Long>{ boolean existsByTutorIdAndRequirementId(Long tutorId,Long requirementId); List<Application> findByTutorId(Long id); List<Application> findByRequirementParentId(Long id); }
