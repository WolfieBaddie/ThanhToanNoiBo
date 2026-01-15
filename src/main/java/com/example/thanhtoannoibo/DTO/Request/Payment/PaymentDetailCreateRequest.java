package com.example.thanhtoannoibo.DTO.Request.Payment;

import lombok.Data;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class PaymentDetailCreateRequest {
    // Người dùng mua Dịch vụ lẻ...
    private UUID serviceId;

    // ...HOẶC mua Gói cước (Package)
    private UUID packageId;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    private BigDecimal quantity;

    @NotNull(message = "Thành tiền không được để trống")
    private BigDecimal amount;
}