package in.tutorlink.entity;
import jakarta.persistence.*; import java.time.*;
@Entity @Table(uniqueConstraints=@UniqueConstraint(columnNames={"tutor_id","requirement_id"})) public class Application { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id; @ManyToOne @JoinColumn(name="tutor_id") public User tutor; @ManyToOne @JoinColumn(name="requirement_id") public TuitionRequirement requirement; @Enumerated(EnumType.STRING) public ApplicationStatus status=ApplicationStatus.PENDING; public String message; public Instant createdAt=Instant.now(); }
