package com.example.thanhtoannoibo.DTO.Request.Voucher;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.UUID;

@Data
public class BuyVoucherRequest {
    private UUID serviceId; // ID của dịch vụ (Vé ăn, vé xe...)
    private int amount;     // Số lượng vé muốn mua (quantity)

    @NotBlank(message = "Vui lòng nhập mã OTP")
    private String otpCode;
}