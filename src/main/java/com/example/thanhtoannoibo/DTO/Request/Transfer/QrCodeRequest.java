package com.example.thanhtoannoibo.DTO.Request.Transfer;
import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class QrCodeRequest {
    @NotNull
    private UUID ownerId;

    @NotBlank
    private String qrType; // STATIC, DYNAMIC, MERCHANT

    private BigDecimal amount;

    private Integer expiresInMinutes;

    private Integer usageLimit;
}
