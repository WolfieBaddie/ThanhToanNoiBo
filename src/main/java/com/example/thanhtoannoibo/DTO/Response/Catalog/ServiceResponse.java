package com.example.thanhtoannoibo.DTO.Response.Catalog;

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
    private boolean isActive;
    @Builder.Default
    private String type = "SERVICE";
}