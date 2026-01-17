package com.example.thanhtoannoibo.Entity.Voucher;

import com.example.thanhtoannoibo.Common.UserVoucherStatus;
import com.example.thanhtoannoibo.Entity.User;
// Giả sử bạn sẽ có Service Entity, nếu chưa có thì dùng UUID tạm
// import com.example.thanhtoannoibo.Entity.App.Service;
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

    // Người sở hữu vé
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User owner;

    // Dịch vụ của vé này (VD: Vé cơm, Vé xe)
    // Tạm thời để UUID nếu chưa có Entity Service, nếu có thì đổi thành @ManyToOne
    @Column(name = "service_id")
    private UUID serviceId;

    @Column(name = "voucher_code", unique = true, nullable = false)
    private String voucherCode;

    // TRẠNG THÁI: AVAILABLE, USED, EXPIRED
    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private UserVoucherStatus status;

    // Giá trị Xu đã trả để mua vé này (để hoàn tiền hoặc đối soát nếu cần)
    @Column(name = "price_at_purchase")
    private BigDecimal priceAtPurchase;

    // Vé này được sinh ra từ giao dịch mua nào?
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

    // ĐÃ XÓA: balance, deductBalance, addBalance (Chuyển sang UserCredits)
}