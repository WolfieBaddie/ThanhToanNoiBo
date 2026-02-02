package com.example.thanhtoannoibo.DTO.Request.Catalog;

import com.example.thanhtoannoibo.Common.CatalogStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Set;
import java.util.UUID;

@Data
public class UpdatePackageRequest {
    private String packageName;
    private BigDecimal price;
    private String description;
    private String packageType;
    private BigDecimal creditValue;
    private CatalogStatus status;
    private Set<UUID> serviceIds; // Nếu muốn cập nhật lại danh sách món
}