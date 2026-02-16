package com.example.thanhtoannoibo.DTO.Response.Voucher;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class BuyVoucherResponse {
    private UUID orderId;
    private UUID transactionId;
    private BigDecimal totalAmount;
    private int quantity;
    private List<String> voucherCodes; // Trả danh sách mã vé để hiển thị ngay
    private LocalDateTime purchasedAt;
    private Integer totalUsage;
}