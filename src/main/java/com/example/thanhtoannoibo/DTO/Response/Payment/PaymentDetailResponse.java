package com.example.thanhtoannoibo.DTO.Response.Payment;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class PaymentDetailResponse {
    private UUID paymentDetailId;

    // --- THÔNG TIN TRANSACTION ---
    // Chỉ giữ lại ID và Mã tham chiếu để định danh.
    // Ngày giờ và các thông tin khác có thể lấy qua API chi tiết Transaction bằng transactionId.
    private UUID transactionId;
    private String transactionRef; // Mã hiển thị (VD: TXN-12345)
    // -----------------------------

    // Thông tin định danh sản phẩm
    private UUID serviceId;
    private String serviceName;

    private UUID packageId;
    private String packageName;

    private BigDecimal quantity;
    private BigDecimal totalAmount;
}