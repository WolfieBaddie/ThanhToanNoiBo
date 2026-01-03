package com.example.thanhtoannoibo.DTO.Request.Transfer;
import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class TransferRequest {
    @NotBlank
    private String qrCode;

    @NotNull
    private UUID senderWalletId;

    private BigDecimal amount;

    private String message;

    @NotNull
    private UUID userId;
}
