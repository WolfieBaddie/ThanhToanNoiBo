package com.example.thanhtoannoibo.DTO.Response.Transaction;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class UserTransactionDetailResponse {
    private UUID transactionId;
    private String transactionRef;

    // --- [KHÁC BIỆT DUY NHẤT] LOGIC HIỂN THỊ ---
    private String title;           // VD: "Đổi 1 Hủ Tiếu"
    private String amountDisplay;   // VD: "-1 Vé" hoặc "-35.000đ"
    private boolean isTicketRedemption; // Flag để frontend tô màu (VD: màu cam cho vé)

    // --- CÁC THÔNG TIN CHUNG (GIỐNG MERCHANT) ---
    private BigDecimal amount;      // Giá trị quy đổi thực tế (Vẫn trả về để tham khảo)
    private String status;
    private String type;
    private String description;
    private LocalDateTime createdAt;
    private String direction;       // IN / OUT

    // --- THÔNG TIN SẢN PHẨM / DỊCH VỤ ---
    private String itemName;
    private String itemImage;
    private String categoryName;
    private BigDecimal quantity;
    private BigDecimal priceAtPurchase;
    private UUID serviceId;
    private UUID packageId;

    // --- [QUAN TRỌNG] THÔNG TIN ĐỐI TÁC & ẢNH XÁC THỰC ---
    private TransactionPartnerInfo partnerInfo; // Chứa Avatar, Tên quán, SĐT...
    private String evidenceImage;               // Ảnh chụp xác thực lúc quét QR

    // --- DEBUG INFO ---
    private UUID qrId;
    private Integer qrUsageLimit;
    private Integer qrUsageCount;

    private List<TransactionItemDetail> items;

    @Data
    @Builder
    public static class TransactionItemDetail {
        private String itemName;
        private String itemImage;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
    }
}