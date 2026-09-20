package in.tutorlink.entity;
import jakarta.persistence.*; import java.time.*;
@Entity public class Notification { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id; @ManyToOne public User user; public String title, body; public boolean read=false; public Instant createdAt=Instant.now(); }
