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
    @NotBlank(message = "Mã QR không được để trống")
    private String qrCode;

    @NotNull(message = "Số tiền hóa đơn không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Số tiền phải lớn hơn 0")
    private BigDecimal billAmount;

    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    private Integer quantity;

    private String description; // Ví dụ: "Thanh toán bàn 5", "Mua Cafe"

    private UUID serviceId;

    private String imageUrl;

    private List<QrItemRequest> items;

    @Data
    public static class QrItemRequest {
        private UUID serviceId;
        private Integer quantity;
    }
}