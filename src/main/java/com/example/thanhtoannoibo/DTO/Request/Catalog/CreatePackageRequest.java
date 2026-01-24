package com.example.thanhtoannoibo.DTO.Request.Catalog;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class CreatePackageRequest {
    @NotBlank(message = "Mã gói không được để trống")
    private String packageCode;

    @NotBlank(message = "Tên gói không được để trống")
    private String packageName;

    private String description;

    @NotNull(message = "Giá không được để trống")
    @Min(value = 0, message = "Giá phải lớn hơn hoặc bằng 0")
    private BigDecimal price;

    @NotBlank(message = "Loại gói không được để trống")
    private String packageType; // CREDIT_VALUE, ITEM_QUANTITY, MIXED

    private BigDecimal creditValue;

    // Danh sách ID các dịch vụ nằm trong gói này (VD: ID Phở, ID Trà đá...)
    private List<UUID> serviceIds;
}
