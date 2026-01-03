package com.example.thanhtoannoibo.DTO.Response.Transfer;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class TransferResponse {
    private UUID requestId;
    private String status;
    private BigDecimal amount;
    private String message;
}
