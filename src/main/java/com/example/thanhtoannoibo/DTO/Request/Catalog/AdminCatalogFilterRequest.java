package com.example.thanhtoannoibo.DTO.Request.Catalog;

import lombok.Data;
import java.util.UUID;

@Data
public class AdminCatalogFilterRequest {
    private String keyword;
    private UUID categoryId;
    private String type; // "SERVICE" (Lẻ) hoặc "PACKAGE" (Combo)
    private Boolean isActive; // Null=All, True=Active, False=Hidden

    // Pagination params (có thể để ở DTO hoặc @RequestParam riêng ở Controller)
}