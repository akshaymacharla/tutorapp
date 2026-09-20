package in.tutorlink.repository; import in.tutorlink.entity.*; import org.springframework.data.jpa.repository.*; import java.util.*;
public interface TuitionRepository extends JpaRepository<TuitionRequirement,Long>{ List<TuitionRequirement> findByActiveTrueOrderByCreatedAtDesc(); List<TuitionRequirement> findByParentIdOrderByCreatedAtDesc(Long parentId); long countByActiveTrue(); }
