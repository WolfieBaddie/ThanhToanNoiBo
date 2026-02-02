package com.example.thanhtoannoibo.DTO.Response.Transaction;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class TransactionResponse {
    private UUID transactionId;
    private String transactionRef; // Mã giao dịch (VD: TXN-123...)

    private String title;          // Tiêu đề hiển thị (VD: Nạp tiền vào ví)
    private String description;    // Mô tả chi tiết

    private BigDecimal amount;     // Số tiền (Luôn dương để hiển thị)
    private String direction;      // "IN" (Cộng) hoặc "OUT" (Trừ)
    private BigDecimal quantity;
    private String status;         // COMPLETED, PENDING, FAILED
    private String transactionType;// DEPOSIT, BUY_VOUCHER...

    private LocalDateTime createdAt;

    private TransactionPartnerInfo partnerInfo;
}