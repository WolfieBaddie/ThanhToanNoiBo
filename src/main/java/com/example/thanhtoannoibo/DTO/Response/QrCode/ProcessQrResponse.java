package com.example.thanhtoannoibo.DTO.Response.QrCode;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ProcessQrResponse {
    private UUID transactionId;
    private String transactionRef;
    private BigDecimal paidAmount;       // Số tiền thực trả cho Merchant
    private BigDecimal refundedAmount;   // Số tiền thừa hoàn lại cho User (nếu có)
    private String status;
    private LocalDateTime processedAt;
    private String message;
}
