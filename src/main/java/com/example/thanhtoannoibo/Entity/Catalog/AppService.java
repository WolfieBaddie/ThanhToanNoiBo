package com.example.thanhtoannoibo.Entity.Catalog;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "services", schema = "app")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppService {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "service_id")
    private UUID serviceId;

    @Column(name = "service_code", nullable = false, unique = true, length = 50)
    private String serviceCode;

    @Column(name = "service_name", nullable = false)
    private String serviceName;

    // --- THAY ĐỔI TẠI ĐÂY ---
    // Bỏ trường String serviceCategory cũ, thay bằng quan hệ ManyToOne

    @ManyToOne(fetch = FetchType.EAGER) // Eager để khi query Service lấy luôn tên Category hiển thị
    @JoinColumn(name = "category_id", referencedColumnName = "category_id")
    private ServiceCategory category;

    @Column(name = "unit_price", precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "image_url", length = 500) // Độ dài 500 để thoải mái lưu link S3/Firebase
    private String imageUrl;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name="udpated_at")
    private LocalDateTime udpatedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}