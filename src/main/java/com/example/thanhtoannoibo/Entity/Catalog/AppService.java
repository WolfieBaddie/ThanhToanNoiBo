package com.example.thanhtoannoibo.Entity.Catalog;
import com.example.thanhtoannoibo.Common.ServiceCategory;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "services", schema = "app")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppService {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "service_id")
    private UUID serviceId;

    @Column(name = "service_code", unique = true, nullable = false, length = 50)
    private String serviceCode; // Mã dịch vụ (VD: "SVC_LUNCH_01")

    @Column(name = "service_name", nullable = false)
    private String serviceName;

    // Phân loại dịch vụ (VD: CANTEEN, PARKING, LAUNDRY...)
    // Có thể dùng Enum nếu danh sách cố định, ở đây để String cho linh động
    @Column(name = "service_category", nullable = false, length = 50)
    private String serviceCategory;

    // Đơn giá tính bằng XU (Credit)
    @Column(name = "unit_price", precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
