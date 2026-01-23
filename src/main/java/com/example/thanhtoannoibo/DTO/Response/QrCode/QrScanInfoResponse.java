package com.example.thanhtoannoibo.DTO.Response.QrCode;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class QrScanInfoResponse {
    // --- 1. Thông tin QR & Voucher ---
    private UUID qrId;
    private String status; // ACTIVE, EXPIRED...
    private String voucherCode;
    private String voucherType; // SINGLE_SERVICE, PACKAGE, GENERIC_CREDIT
    private BigDecimal remainingAmount; // Nếu là voucher tiền (Generic)
    private Integer remainingUsage;     // Số lần dùng còn lại

    // --- 2. Thông tin Người sở hữu (User Owner) ---
    private UserInfo ownerInfo;

    // --- 3. Thông tin Gói/Dịch vụ (Để Merchant chọn) ---
    // Nếu là Voucher lẻ -> List có 1 phần tử.
    // Nếu là Package -> List có nhiều phần tử (Bún, Phở, Miến...) để Merchant tick chọn.
    private List<RedeemableItem> redeemableItems;

    // --- Inner Classes ---

    @Data
    @Builder
    public static class UserInfo {
        private UUID userId;
        private String fullName;
        private String email;
        private String phoneNumber;
        private String studentCode; // Nếu có
        private String avatarUrl;
    }

    @Data
    @Builder
    public static class RedeemableItem {
        private UUID serviceId;      // ID để merchant gửi lên khi processTransaction
        private String serviceName;
        private String serviceCode;
        private String imageUrl;
        private String categoryName;
        private boolean isSelectedDefault; // Gợi ý chọn mặc định
    }
}
