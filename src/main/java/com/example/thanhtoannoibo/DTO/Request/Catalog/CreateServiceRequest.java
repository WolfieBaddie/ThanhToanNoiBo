package com.example.thanhtoannoibo.DTO.Request.Catalog;

import com.example.thanhtoannoibo.DTO.Request.BaseRequest;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
public class CreateServiceRequest extends BaseRequest {

    @NotBlank(message = "Mã dịch vụ không được để trống")
    private String serviceCode;

    @NotBlank(message = "Tên dịch vụ không được để trống")
    private String serviceName;

    @NotNull(message = "Phải chọn danh mục")
    private UUID categoryId;

    @NotNull(message = "Giá tiền không được để trống")
    @Min(value = 0, message = "Giá tiền phải lớn hơn hoặc bằng 0")
    private BigDecimal unitPrice;

    private String imageUrl;
}