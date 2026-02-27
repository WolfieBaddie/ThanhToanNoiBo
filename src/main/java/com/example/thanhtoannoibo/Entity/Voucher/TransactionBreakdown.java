package com.example.thanhtoannoibo.Entity.Voucher;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "transaction_breakdowns", schema = "app")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionBreakdown {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "breakdown_id")
    private UUID breakdownId;

    // Liên kết 1-1 với bảng Transactions
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", nullable = false)
    private Transaction transaction;

    // --- PHẦN TIỀN HÀNG ---
    @Column(name = "amount_original", nullable = false)
    private BigDecimal amountOriginal; // Giá gốc sản phẩm (Chưa thuế)

    // --- PHẦN THUẾ (User trả) ---
    @Column(name = "tax_rate")
    private BigDecimal taxRate; // % Thuế (VD: 10.0)

    @Column(name = "tax_amount")
    private BigDecimal taxAmount; // Tiền thuế (VD: 10,000)

    // --- PHẦN PHÍ SÀN (Merchant chịu) ---
    @Column(name = "platform_fee_rate")
    private BigDecimal platformFeeRate; // % Phí sàn (VD: 2.0)

    @Column(name = "platform_fee_amount")
    private BigDecimal platformFeeAmount; // Tiền phí sàn

    // --- PHẦN MERCHANT THỰC NHẬN ---
    @Column(name = "merchant_net_amount")
    private BigDecimal merchantNetAmount; // = (Gốc + Thuế) - Phí Sàn

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
