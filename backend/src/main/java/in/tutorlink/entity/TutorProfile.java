package in.tutorlink.entity;
import jakarta.persistence.*; import java.util.*;
@Entity public class TutorProfile { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id; @OneToOne(optional=false) public User user;
 public String college, degree, branch, studyYear, location, teachingMode, availability, bio; public int experienceYears; public int monthlyFee; public double rating=0; public int completedTuitions=0;
 @Enumerated(EnumType.STRING) public VerificationStatus verificationStatus=VerificationStatus.NOT_VERIFIED;
 @ElementCollection(fetch=FetchType.EAGER) public Set<String> subjects=new HashSet<>(); @ElementCollection(fetch=FetchType.EAGER) public Set<String> classes=new HashSet<>(); @ElementCollection(fetch=FetchType.EAGER) public Set<String> languages=new HashSet<>(); }
