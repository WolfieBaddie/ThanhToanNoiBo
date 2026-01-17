package com.example.thanhtoannoibo.DTO.Response.Voucher;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class UserVoucherResponse {
    private UUID voucherId;
    private String voucherCode; // Mã hiển thị (VD: SVC-BKF-...)
    private String status;      // ACTIVE, USED...

    // --- THÔNG TIN DỊCH VỤ (Map từ AppService) ---
    private UUID serviceId;
    private String serviceName; // Tên món ăn / dịch vụ
    private String imageUrl;    // Ảnh minh họa
    private String categoryName;// Bữa sáng, Trưa...

    // --- THÔNG TIN GIÁ & HẠN DÙNG ---
    private BigDecimal priceAtPurchase; // Giá trị vé
    private LocalDateTime createdAt;    // Ngày mua
    private LocalDateTime expiresAt;    // Hạn sử dụng
    private LocalDateTime usedAt;       // Ngày sử dụng (nếu đã dùng)

    // Cờ kiểm tra nhanh cho Frontend (VD: đổi màu thẻ nếu hết hạn)
    private boolean isExpired;

    private String qrContent;
}