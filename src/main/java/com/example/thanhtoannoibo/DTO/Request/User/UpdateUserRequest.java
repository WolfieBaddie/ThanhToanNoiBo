package com.example.thanhtoannoibo.DTO.Request.User;
import com.example.thanhtoannoibo.Common.UserStatus;
import lombok.Data;

import java.util.Set;

@Data
public class UpdateUserRequest {
    private String fullName;
    private String phoneNumber;
    private String imageUrl;
    private UserStatus status;

    private String role;

    private String newPassword;
}