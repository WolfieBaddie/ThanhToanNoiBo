package com.example.thanhtoannoibo.DTO.Request.Catalog;

import com.example.thanhtoannoibo.Common.CatalogStatus;
import lombok.Data;

@Data
public class UpdateCategoryRequest {
    private String categoryName;
    private String description;
    private String iconUrl;
    private CatalogStatus status;
}