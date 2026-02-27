package com.example.thanhtoannoibo.DTO.Response.Catalog;

import com.example.thanhtoannoibo.Common.CatalogStatus;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class ServiceResponse {
    private UUID serviceId;
    private String serviceCode;
    private String serviceName;
    private BigDecimal unitPrice;
    private String categoryName;
    private String imageUrl;
    private CatalogStatus status;
    private String masterServiceCode;

    @Builder.Default
    private String type = "SERVICE";

    private UUID detailId;
    private Integer remainingQuantity;
}