package com.example.thanhtoannoibo.Entity.Voucher;
import com.example.thanhtoannoibo.Entity.Catalog.AppPackage;
import com.example.thanhtoannoibo.Entity.Catalog.AppService;
import com.example.thanhtoannoibo.Entity.Catalog.Counter;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payment_details", schema = "app")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "payment_id")
    private UUID paymentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id")
    private Transaction transaction;

    // Nếu mua dịch vụ lẻ
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id")
    private AppService service; // Giả sử bạn có entity Service

    // Nếu mua gói Package
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id")
    private AppPackage packageRef; // Giả sử bạn có entity Package

    @Column(name = "quantity")
    private BigDecimal quantity;

    @Column(name = "amount")
    private BigDecimal amount; // Thành tiền của dòng này

    @CreationTimestamp // Tự động lấy giờ hệ thống khi INSERT
    @Column(name="created_at", updatable = false) // Không cho update cột này
    private LocalDateTime createdAt;
}
