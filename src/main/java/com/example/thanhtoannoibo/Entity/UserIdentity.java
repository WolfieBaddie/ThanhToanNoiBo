package com.example.thanhtoannoibo.Entity;
import com.example.thanhtoannoibo.Common.IdentityProvider;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Entity
@Table(schema = "auth", name = "user_identities",
        uniqueConstraints = @UniqueConstraint(name = "uq_identity", columnNames = {"provider", "identifier"}))
public class UserIdentity {
    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IdentityProvider provider;

    @Column(nullable = false)
    private String identifier;

    @Column(name = "is_primary", nullable = false)
    private boolean primaryIdentity;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID();
    }
}
