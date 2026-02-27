package com.example.thanhtoannoibo.DTO.Request.Catalog;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Set;
import java.util.UUID;

@Data
public class CreatePackageRequest {
    @NotBlank(message = "Mã gói không được để trống")
    private String packageCode;

    @NotBlank(message = "Tên gói không được để trống")
    private String packageName;

    @NotNull(message = "Giá không được để trống")
    @Min(value = 0, message = "Giá không được âm")
    private BigDecimal price;

    @NotBlank(message = "Mô tả không được để trống")
    private String description;

    // Loại gói: 'CREDIT_VALUE', 'ITEM_QUANTITY', 'MIXED'
    @NotBlank(message = "Loại gói không được để trống")
    private String packageType;

    private String comboType;

    private BigDecimal creditValue; // Optional, tùy loại gói

    @NotEmpty(message = "Gói phải chứa ít nhất 1 dịch vụ")
    private Set<UUID> serviceIds; // Danh sách ID các món ăn/dịch vụ trong gói
}