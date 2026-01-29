package com.example.thanhtoannoibo.DTO.Request.QrCode;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class ProcessQrRequest {
    @NotNull(message = "QR Code không được để trống")
    private String qrCode;
    @DecimalMin(value = "0.0", inclusive = true, message = "Số tiền không được âm")
    private BigDecimal billAmount;

    private Integer quantity;
    private String description;
    private String imageUrl;

    // Các trường phục vụ chọn món (Combo)
    private UUID serviceId;
    private List<QrItemRequest> items;

    @Data
    public static class QrItemRequest {
        private UUID serviceId;
        private Integer quantity;
    }
}