package com.example.thanhtoannoibo.DTO.Request.Admin;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminUpdateCounterRequest {
    @NotBlank(message = "Tên quầy không được để trống")
    private String counterName;

    @NotBlank(message = "Địa chỉ không được để trống")
    private String location;

    // Admin có thể set trạng thái quầy thủ công nếu muốn
    private String status;
}
