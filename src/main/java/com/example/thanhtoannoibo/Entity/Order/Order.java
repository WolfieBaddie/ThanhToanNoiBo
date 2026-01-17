package com.example.thanhtoannoibo.Entity.Order;
import com.example.thanhtoannoibo.Common.OrderMethod;
import com.example.thanhtoannoibo.Common.OrderStatus;
import com.example.thanhtoannoibo.Common.PaymentStatus;
import com.example.thanhtoannoibo.Entity.Catalog.AppPackage;
import com.example.thanhtoannoibo.Entity.Catalog.AppService;
import com.example.thanhtoannoibo.Entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "orders", schema = "app")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "order_id")
    private UUID orderId;

    @Column(name = "order_ref", unique = true, nullable = false)
    private String orderRef; // Mã đơn hàng (VD: ORD-20240101-XM92)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // Người đặt mua (thường là Phụ huynh)

    // Link tới gói cước (Nếu mua gói nạp xu)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id")
    private AppPackage packageEntity;

    // Link tới dịch vụ (Nếu mua lẻ, ít dùng trong model nạp xu nhưng cứ để theo schema)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id")
    private AppService serviceEntity;

    @Column(name = "amount_paid", nullable = false)
    private BigDecimal amountPaid; // Số tiền VNĐ phải trả

    @Enumerated(EnumType.STRING)
    @Column(name = "order_method")
    private OrderMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name="payment_status")
    private PaymentStatus paymentStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_status")
    private OrderStatus orderStatus;

    @Column(name = "gateway_transaction_id")
    private String gatewayTransactionId; // Mã giao dịch trả về từ VNPay/Bank

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
