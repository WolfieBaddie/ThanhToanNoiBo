package com.example.thanhtoannoibo.DTO.Response.Catalog;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MasterServiceResponse {
    private UUID masterId;
    private String serviceCode;
    private String serviceName;
    private BigDecimal fixedPrice;
    private String imageUrl;
    private String description;

    private String categoryName;

    private boolean isRegistered;
}
