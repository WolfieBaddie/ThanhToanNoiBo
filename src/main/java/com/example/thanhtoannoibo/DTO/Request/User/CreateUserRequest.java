package com.example.thanhtoannoibo.DTO.Request.User;
import com.example.thanhtoannoibo.Common.UserType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Set;

@Data
public class CreateUserRequest {
    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 3, message = "Tên đăng nhập phải có ít nhất 3 ký tự")
    private String username;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
    private String password;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    @NotBlank(message = "Họ tên không được để trống")
    private String fullName;

    private String phoneNumber;

    private String imageUrl;

    // [THAY ĐỔI] Chỉ nhận 1 Role Code duy nhất (VD: "MERCHANT", "ADMIN")
    // UserType sẽ được tự động suy diễn từ Role này
    @NotBlank(message = "Vui lòng chọn vai trò")
    private String role;
}