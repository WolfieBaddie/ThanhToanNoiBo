package com.example.thanhtoannoibo.DTO.Response.Payment;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@Getter
@Setter
public class PaymentDetailResponse {
    private UUID paymentDetailId;
    private String serviceName;   // Resolved from Service Entity
    private String counterName;   // Resolved from Counter Entity
    private String counterLocation;
    private BigDecimal quantity;
    private BigDecimal totalAmount;
}
