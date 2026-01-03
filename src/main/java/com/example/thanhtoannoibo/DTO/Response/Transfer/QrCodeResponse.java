package com.example.thanhtoannoibo.DTO.Response.Transfer;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class QrCodeResponse {
    private UUID qrId;
    private String qrCode;
    private String qrType;
    private BigDecimal amount;
    private LocalDateTime expiresAt;
    private Integer usageLimit;
    private Integer usageCount;
    private String status;
}
