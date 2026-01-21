package com.example.thanhtoannoibo.DTO.Request.Auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenerateOtpRequest {

    /**
     * Loại hành động cần xác thực.
     * Các giá trị hợp lệ: "TRANSACTION", "LOGIN", "FORGOT_PASSWORD"
     * Ví dụ: Khi mua voucher thì gửi "TRANSACTION"
     */
    @NotBlank(message = "Vui lòng nhập loại hành động (actionType)")
    private String actionType;
}