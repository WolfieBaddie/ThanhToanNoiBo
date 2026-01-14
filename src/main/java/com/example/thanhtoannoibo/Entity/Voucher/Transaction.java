package com.example.thanhtoannoibo.Entity.Voucher;

import com.example.thanhtoannoibo.Common.TransactionStatus;
import com.example.thanhtoannoibo.Common.TransactionType;
import com.example.thanhtoannoibo.Entity.QrCode.QRCode;
import com.example.thanhtoannoibo.Entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "transactions", schema = "app")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "transaction_id")
    private UUID transactionId;

    @Column(name = "transaction_ref", unique = true, nullable = false)
    private String transactionRef;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    private TransactionType transactionType;

    // --- THAY ĐỔI LỚN ---
    // Trước đây là voucher_id (Ví), giờ DB đổi thành credit_id (Kho Xu).
    // Vì chưa có Entity UserCredit, ta tạm để UUID để code không bị lỗi compile.
    // Sau này khi tạo UserCredit.java, bạn đổi thành:
    // @ManyToOne \n @JoinColumn(name = "credit_id") \n private UserCredit credit;
    @Column(name = "credit_id")
    private UUID creditId;
    // --------------------

    // Người nhận tiền (nếu có - giữ nguyên logic cũ)
    @ManyToOne
    @JoinColumn(name = "payee_user_id")
    private User payee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "qr_id")
    private QRCode qrCode;

    @Column(name = "amount", nullable = false)
    private BigDecimal amount;

    @Column(name = "balance_after", nullable = false)
    private BigDecimal balanceAfter;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private TransactionStatus status;

    @Column(name = "description")
    private String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata")
    private Map<String, Object> metadata;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}