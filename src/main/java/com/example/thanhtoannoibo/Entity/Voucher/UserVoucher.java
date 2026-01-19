package com.example.thanhtoannoibo.Entity.Voucher;

import com.example.thanhtoannoibo.Common.UserVoucherStatus;
import com.example.thanhtoannoibo.Entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_vouchers", schema = "app")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserVoucher {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "voucher_id")
    private UUID voucherId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User owner;

    // [THAY ĐỔI]: Không bắt buộc lưu serviceId nữa (nullable = true)
    @Column(name = "service_id")
    private UUID serviceId;

    // [MỚI]: Lưu cứng tên dịch vụ tại thời điểm mua
    @Column(name = "service_name")
    private String serviceName;

    // [MỚI]: Lưu thêm ảnh và danh mục để hiển thị mà không cần join bảng
    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "category_name")
    private String categoryName;

    @Column(name = "voucher_code", unique = true, nullable = false)
    private String voucherCode;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private UserVoucherStatus status;

    @Column(name = "price_at_purchase")
    private BigDecimal priceAtPurchase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_transaction_id")
    private Transaction purchaseTransaction;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
}