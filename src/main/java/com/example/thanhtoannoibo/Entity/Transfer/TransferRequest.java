package com.example.thanhtoannoibo.Entity.Transfer;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "transfer_requests", schema = "app")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransferRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "request_id")
    private UUID requestId;

    @Column(name = "qr_id")
    private UUID qrId;

    @Column(name = "sender_wallet_id", nullable = false)
    private UUID senderWalletId;

    @Column(name = "receiver_wallet_id", nullable = false)
    private UUID receiverWalletId;

    @Column(name = "amount", nullable = false)
    private BigDecimal amount;

    @Column(name = "status")
    private String status = "PENDING";

    @Column(name = "request_type", nullable = false)
    private String requestType;

    @Column(name = "message")
    private String message;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "transaction_id")
    private UUID transactionId;
}
