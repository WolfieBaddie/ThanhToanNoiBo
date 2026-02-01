package com.example.thanhtoannoibo.DTO.Request.Catalog;

import com.example.thanhtoannoibo.Common.CatalogStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class UpdateServiceRequest {
    private String serviceName;
    private BigDecimal unitPrice;
    private String imageUrl;

    private String description;
    private UUID categoryId;

    private CatalogStatus status;
    private List<UUID> assignedCounterIds;
}