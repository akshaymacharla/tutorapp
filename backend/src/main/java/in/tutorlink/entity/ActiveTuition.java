package in.tutorlink.entity;
import jakarta.persistence.*; import java.time.*;
@Entity @Table(uniqueConstraints=@UniqueConstraint(columnNames="application_id")) public class ActiveTuition {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
 @OneToOne(optional=false) @JoinColumn(name="application_id") public Application application;
 @ManyToOne(optional=false) public User parent; @ManyToOne(optional=false) public User tutor;
 public String status="ACTIVE"; public Instant startedAt=Instant.now(); public Instant completedAt;
}
