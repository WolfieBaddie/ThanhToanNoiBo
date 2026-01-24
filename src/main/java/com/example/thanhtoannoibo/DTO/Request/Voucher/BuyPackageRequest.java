package com.example.thanhtoannoibo.DTO.Request.Voucher;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class BuyPackageRequest {
    @NotNull(message = "Package ID cannot be null")
    private UUID packageId;

    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    @NotBlank(message = "Vui lòng nhập mã OTP")
    private String otpCode;
}
