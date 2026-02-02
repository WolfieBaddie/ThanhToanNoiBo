package com.example.thanhtoannoibo.DTO.Request.Catalog;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CreateMasterServiceRequest {
    @NotBlank(message = "Mã dịch vụ không được để trống")
    private String serviceCode;

    @NotBlank(message = "Tên dịch vụ không được để trống")
    private String serviceName;

    @NotNull(message = "Giá niêm yết không được để trống")
    @Min(value = 0, message = "Giá không được âm")
    private BigDecimal fixedPrice;

    @NotNull(message = "Phải chọn danh mục")
    private UUID categoryId;

    private String imageUrl;
    private String description;
}
