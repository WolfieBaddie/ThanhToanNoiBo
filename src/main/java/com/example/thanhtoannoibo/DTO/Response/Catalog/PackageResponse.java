package com.example.thanhtoannoibo.DTO.Response.Catalog;
import com.example.thanhtoannoibo.DTO.Response.Catalog.ServiceResponse;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class PackageResponse {private UUID packageId;
    private String packageCode;
    private String packageName;
    private String description;
    private BigDecimal price;
    private String packageType;
    private BigDecimal creditValue;
    private Boolean isActive;

    // Danh sách các món trong gói (để user biết gói này gồm những gì)
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

}
