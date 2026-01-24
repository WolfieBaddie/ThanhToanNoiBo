package com.example.thanhtoannoibo.DTO.Request.QrCode;

import com.example.thanhtoannoibo.Common.QrCodeType;
import com.example.thanhtoannoibo.DTO.Request.BaseRequest;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
public class GenerateQrRequest extends BaseRequest {

    @NotNull(message = "Loại QR không được để trống")
    private QrCodeType type;

    private UUID voucherId; // Optional: Nếu sinh QR để dùng Voucher cụ thể

    private Integer expiresInMinutes; // Thời gian hết hạn (phút)

    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    private Integer quantity;
}