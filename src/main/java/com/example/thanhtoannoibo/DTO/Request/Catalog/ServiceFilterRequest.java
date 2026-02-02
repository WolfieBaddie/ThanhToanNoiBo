package com.example.thanhtoannoibo.DTO.Request.Catalog;

import com.example.thanhtoannoibo.Common.CatalogStatus;
import lombok.Data;
import java.util.UUID;

@Data
public class ServiceFilterRequest {
    private String keyword;      // Tìm theo tên hoặc mã
    private UUID categoryId;     // Lọc theo danh mục

    private CatalogStatus status;
    private Boolean system;
}