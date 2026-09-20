package in.tutorlink.entity;
import jakarta.persistence.*; import java.time.*; import java.util.*;
@Entity public class TuitionRequirement { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id; @ManyToOne(optional=false) public User parent;
 public String studentClass, location, teachingMode, days, preferredTime, genderPreference, additionalRequirements; public int budget, classesPerWeek; public LocalDate startDate; public boolean active=true; public Instant createdAt=Instant.now(); @ElementCollection(fetch=FetchType.EAGER) public Set<String> subjects=new HashSet<>(); }
