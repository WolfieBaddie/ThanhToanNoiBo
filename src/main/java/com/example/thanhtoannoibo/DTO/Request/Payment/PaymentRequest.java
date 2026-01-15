package com.example.thanhtoannoibo.DTO.Request.Payment;

import com.example.thanhtoannoibo.Common.PaymentRequestType;
import lombok.Data;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class PaymentRequest {
    @NotNull(message = "Số tiền không được để trống")
    @Min(value = 1000, message = "Số tiền thanh toán tối thiểu là 1,000 VND")
    private BigDecimal amount;

    @NotBlank(message = "Nội dung thanh toán không được để trống")
    private String orderInfo;

    // Client không cần gửi userId nữa, server tự lấy từ Token
    private UUID userId;

    private String bankCode;
    private String language;

    // --- CÁC TRƯỜNG MỚI CHO LUỒNG NGHIỆP VỤ ---

    @NotNull(message = "Loại giao dịch là bắt buộc (TOP_UP, PAYMENT, TRANSFER)")
    private PaymentRequestType type;

    private UUID serviceId; // Nếu mua dịch vụ lẻ (VD: Vé ăn)
    private UUID packageId; // Nếu mua gói cước (VD: Gói tháng)
}