package com.example.thanhtoannoibo.DTO.Response.Catalog;

import com.example.thanhtoannoibo.Common.CatalogStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class AdminServiceResponse {
    // Thông tin chung của Dịch vụ (Lấy từ đại diện 1 bản ghi AppService)
    private UUID serviceId;
    private String serviceCode;
    private String serviceName;
    private String imageUrl;
    private String description;
    private String categoryName;
    private CatalogStatus status;
    private String masterServiceCode;
    // Thống kê giá (Vì mỗi merchant có thể bán giá khác nhau)
    private BigDecimal minPrice;
    private BigDecimal maxPrice;

    // Danh sách Merchant đang bán món này
    private List<MerchantInfo> merchants;

    @Data
    @Builder
    public static class MerchantInfo {
        private UUID merchantId;
        private String merchantName;  // Tên chủ quán
        private String counterName;   // Tên quầy
        private UUID serviceId;       // ID bản ghi AppService cụ thể
        private BigDecimal unitPrice; // Giá bán của quán này
        private CatalogStatus status; // Trạng thái kinh doanh (ACTIVE/PENDING...)
    }
}