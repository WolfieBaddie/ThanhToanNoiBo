package com.example.thanhtoannoibo.Entity;
import com.example.thanhtoannoibo.Common.UserStatus;
import com.example.thanhtoannoibo.Common.UserType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Entity
@Table(schema = "security", name = "users")
public class UserAccount {
    @Id
    @Column(name = "user_id", columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "user_name")
    private String userName;

    @Column(name = "password_hash")
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_type", nullable = false)
    private UserType userType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column
    private String email;

    @Column
    private String phone;

    // chỉ cần UUID để tránh kéo entity core sang nếu chưa cần
    @Column(name = "home_service_unit_id", columnDefinition = "uuid")
    private UUID homeServiceUnitId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name="last_login_at", nullable = false)
    private Instant lastLoginAt;

    @PrePersist
    public void prePersist() {
        if (userId == null) userId = UUID.randomUUID();
        if (status == null) status = UserStatus.PENDING;
    }
}
