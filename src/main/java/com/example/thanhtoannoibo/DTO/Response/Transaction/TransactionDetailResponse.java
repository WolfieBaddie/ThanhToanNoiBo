package com.example.thanhtoannoibo.DTO.Response.Transaction;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class TransactionDetailResponse {
    // --- THÔNG TIN GIAO DỊCH ---
    private UUID transactionId;
    private String transactionRef;
    private BigDecimal amount;      // Tổng tiền
    private String status;          // Trạng thái
    private String type;            // Loại (DEPOSIT/BUY_VOUCHER...)
    private String description;     // Mô tả giao dịch
    private LocalDateTime createdAt;
    private String direction;       // IN / OUT

    // --- THÔNG TIN SẢN PHẨM (Lấy từ PaymentDetail & Service) ---
    private String itemName;        // Tên món ăn / Tên gói / "Nạp tiền"
    private String itemImage;       // Ảnh món ăn (URL)
    private String categoryName;    // Tên danh mục (VD: Bữa sáng)

    private BigDecimal quantity;    // Số lượng
    private BigDecimal priceAtPurchase; // Giá lúc mua (đơn giá)

    // ID để frontend redirect nếu cần click vào xem sản phẩm gốc
    private UUID serviceId;
    private UUID packageId;

    private TransactionPartnerInfo partnerInfo;
    private String evidenceImage;
}