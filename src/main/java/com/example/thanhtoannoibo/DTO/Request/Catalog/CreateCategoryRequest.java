package com.example.thanhtoannoibo.DTO.Request.Catalog;

import com.example.thanhtoannoibo.DTO.Request.BaseRequest;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class CreateCategoryRequest extends BaseRequest {

    @NotBlank(message = "Mã danh mục không được để trống")
    private String categoryCode;

    @NotBlank(message = "Tên danh mục không được để trống")
    private String categoryName;

    private String description;
    private String iconUrl;
}