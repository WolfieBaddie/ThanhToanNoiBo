package com.example.thanhtoannoibo.DTO.Request.Payment;
import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

@Data
public class PaymentRequest {
    @NotNull
    private BigDecimal amount;

    @NotBlank
    private String orderInfo;

    private String bankCode;

    private String language;
}
