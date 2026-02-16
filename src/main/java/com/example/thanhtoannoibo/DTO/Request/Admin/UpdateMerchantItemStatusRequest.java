package com.example.thanhtoannoibo.DTO.Request.Admin;
import com.example.thanhtoannoibo.Common.CatalogStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateMerchantItemStatusRequest {
    @NotNull(message = "Trạng thái không được để trống")
    private CatalogStatus status; // ACTIVE, INACTIVE, DELETED, REJECTED

    private String reason; // Lý do khóa/xóa (để ghi log và thông báo)
}