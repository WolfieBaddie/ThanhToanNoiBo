package com.example.thanhtoannoibo.DTO.Response.Catalog;

import com.example.thanhtoannoibo.Common.CatalogStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class PackageResponse {
    private UUID packageId;
    private String packageCode;
    private String packageName;
    private String description;
    private BigDecimal price;
    private String packageType;
    private BigDecimal creditValue;
    private CatalogStatus status;

    // [MỚI] Thông tin chủ sở hữu gói (Quán & Địa điểm)
    private MerchantInfo merchantInfo;

    // Danh sách các món trong gói
    private List<PackageServiceItem> items;

    @Builder.Default
    private String type = "PACKAGE";

    @Data
    @Builder
    public static class PackageServiceItem {
        private UUID serviceId;
        private String serviceName;
        private String imageUrl;
        private BigDecimal originalPrice;
    }

    // [MỚI] Class chứa thông tin Merchant & Counter
    @Data
    @Builder
    public static class MerchantInfo {
        private UUID merchantId;
        private String merchantName;  // Tên chủ quán
        private UUID counterId;
        private String counterName;   // Tên quầy
        private String location;      // Địa điểm (để User biết chỗ quét)
    }
}