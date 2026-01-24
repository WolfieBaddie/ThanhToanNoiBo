package com.example.thanhtoannoibo.Entity.Catalog;
import com.example.thanhtoannoibo.Common.PackageType;
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

    // 'CREDIT_VALUE', 'ITEM_QUANTITY', 'MIXED'
    @Column(name = "package_type", nullable = false)
    private String packageType;

    @Column(name = "credit_value")
    private BigDecimal creditValue;

    @Column(name = "is_active")
    private Boolean isActive;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Quan hệ Many-to-Many với AppService thông qua bảng trung gian package_services
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "package_services",
            schema = "app",
            joinColumns = @JoinColumn(name = "package_id"),
            inverseJoinColumns = @JoinColumn(name = "service_id")
    )
    @ToString.Exclude // Tránh vòng lặp khi log
    @EqualsAndHashCode.Exclude
    private Set<AppService> services = new HashSet<>();
}
