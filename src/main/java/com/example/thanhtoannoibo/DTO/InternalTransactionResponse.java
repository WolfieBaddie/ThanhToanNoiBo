package com.example.thanhtoannoibo.DTO;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class InternalTransactionResponse {
    private UUID transactionId;
    private String transactionRef;
    private BigDecimal amount;
    private BigDecimal balanceAfter; // Useful for the sender to see remaining balance
    private String message;
    private String status;
    private LocalDateTime timestamp;
}
