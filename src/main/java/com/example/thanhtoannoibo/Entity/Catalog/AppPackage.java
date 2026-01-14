package com.example.thanhtoannoibo.Entity.Catalog;
import com.example.thanhtoannoibo.Common.PackageType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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

    @Column(name = "package_code", unique = true, nullable = false, length = 50)
    private String packageCode; // Mã gói (VD: "PKG_CREDIT_50K")

    @Column(name = "package_name", nullable = false)
    private String packageName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // Giá tiền thật (VND) user phải trả qua cổng thanh toán
    @Column(name = "price", nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(name = "package_type", nullable = false)
    private PackageType packageType;

    // Số lượng Xu user nhận được sau khi mua (quan trọng nhất)
    @Column(name = "credit_value", precision = 15, scale = 2)
    private BigDecimal creditValue;

    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
