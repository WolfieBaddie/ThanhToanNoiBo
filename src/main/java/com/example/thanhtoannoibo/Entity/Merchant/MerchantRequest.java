package com.example.thanhtoannoibo.Entity.Merchant;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "merchant_requests", schema = "app")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MerchantRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "request_id")
    private UUID requestId;

    @Column(name = "merchant_id", nullable = false)
    private UUID merchantId;

    @Column(name = "request_type", length = 50)
    @Builder.Default
    private String requestType = "UPDATE_INFO";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "request_data")
    private String requestData; // Lưu JSON thông tin Merchant gửi lên

    @Column(name = "status", length = 20)
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED

    @Column(name = "rejection_reason", columnDefinition = "text")
    private String rejectionReason;

    @Column(name = "reviewed_by")
    private UUID reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "review_image_url", length = 500)
    private String reviewImageUrl; // Ảnh Admin gửi lên khi duyệt (ảnh bill chuyển tiền/xác nhận)

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = "PENDING";
    }
}