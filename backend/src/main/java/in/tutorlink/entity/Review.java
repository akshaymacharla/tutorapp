package in.tutorlink.entity;
import jakarta.persistence.*; import java.time.*;
@Entity @Table(name="reviews",uniqueConstraints=@UniqueConstraint(columnNames="active_tuition_id")) public class Review {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id; @OneToOne(optional=false) @JoinColumn(name="active_tuition_id") public ActiveTuition activeTuition;
 @ManyToOne(optional=false) public User parent; @ManyToOne(optional=false) public User tutor; public int rating; @Column(length=1000) public String text; public Instant createdAt=Instant.now();
}
