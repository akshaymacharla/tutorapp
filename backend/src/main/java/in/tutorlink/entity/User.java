package in.tutorlink.entity;
import com.fasterxml.jackson.annotation.JsonIgnore; import jakarta.persistence.*; import java.time.*;
@Entity @Table(name="users") public class User {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
 @Column(unique=true,nullable=false) public String email; @JsonIgnore @Column(nullable=false) public String password;
 @Column(nullable=false) public String fullName; @Enumerated(EnumType.STRING) @Column(nullable=false) public Role role;
 public String phone; public String location; public Instant createdAt=Instant.now(); public Instant updatedAt=Instant.now();
}
