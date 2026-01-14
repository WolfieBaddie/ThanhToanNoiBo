package com.example.thanhtoannoibo.Entity.QrCode;
import com.example.thanhtoannoibo.Common.QrCodeStatus;
import com.example.thanhtoannoibo.Common.QrCodeType;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Entity.Voucher.UserVoucher;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "qr_codes", schema = "app")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QRCode {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "qr_id")
    private UUID qrId;

    @Column(name = "qr_code", unique = true, nullable = false)
    private String codeString; // Chuỗi token trong QR image

    @Enumerated(EnumType.STRING)
    @Column(name = "qr_type", nullable = false)
    private QrCodeType type;

    // Người tạo QR (Người nhận xu hoặc người chuyển xu tùy ngữ cảnh)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voucher_id")
    private UserVoucher payerVoucher;

    @Column(name = "owner_type")
    private String ownerType;

    @Column(name = "amount")
    private BigDecimal amount; // Số xu set cứng (nếu có)

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "usage_limit")
    private int usageLimit;

    @Column(name = "usage_count")
    private int usageCount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private QrCodeStatus status;

    // Lưu metadata dạng JSON (Ví dụ: lời nhắn, transaction ID tham chiếu)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata")
    private Map<String, Object> metadata;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;
}
