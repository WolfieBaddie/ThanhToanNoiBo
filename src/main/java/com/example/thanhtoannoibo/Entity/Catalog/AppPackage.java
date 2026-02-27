package com.example.thanhtoannoibo.Entity.Catalog;

import com.example.thanhtoannoibo.Common.CatalogStatus; // Import Enum
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "packages", schema = "app")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppPackage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "package_id")
    private UUID packageId;

    @Column(name = "package_code", nullable = false, unique = true)
    private String packageCode;

    @Column(name = "package_name", nullable = false)
    private String packageName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "price", nullable = false)
    private BigDecimal price;

    @Column(name = "package_type", nullable = false)
    private String packageType;

    @Column(name = "credit_value")
    private BigDecimal creditValue;

    @Column(name = "combo_type")
    private String comboType;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    @Builder.Default
    private CatalogStatus status = CatalogStatus.ACTIVE;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "counter_id")
    private Counter counter;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "package_services",
            schema = "app",
            joinColumns = @JoinColumn(name = "package_id"),
            inverseJoinColumns = @JoinColumn(name = "service_id")
    )
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    private Set<AppService> services = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        if (status == null) {
            status = CatalogStatus.ACTIVE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}