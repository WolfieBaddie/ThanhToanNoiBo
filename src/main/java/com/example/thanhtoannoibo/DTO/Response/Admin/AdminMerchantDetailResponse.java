package com.example.thanhtoannoibo.DTO.Response.Admin;
import com.example.thanhtoannoibo.Common.CatalogStatus;
import com.example.thanhtoannoibo.Common.UserStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class AdminMerchantDetailResponse {
    private UUID userId;
    private String fullName;
    private String email;
    private String phoneNumber;
    private UserStatus userStatus;

    // 2. Thông tin Quầy hàng (Counter)
    private CounterInfo counter;

    // 3. Danh sách tài sản
    private List<ItemInfo> services;
    private List<ItemInfo> packages;

    @Data
    @Builder
    public static class CounterInfo {
        private UUID counterId;
        private String counterName;
        private String location;
        private String counterCode;
        private String status; // ACTIVE, INACTIVE...
    }

    @Data
    @Builder
    public static class ItemInfo {
        private UUID itemId; // serviceId hoặc packageId
        private String itemCode;
        private String itemName;
        private BigDecimal price;
        private CatalogStatus status;
        private String imageUrl;
        private String type; // "SERVICE" hoặc "PACKAGE"
    }
}
