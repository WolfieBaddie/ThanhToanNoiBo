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

    // Admin có thể cấp lại quyền
    private Set<String> roles;
}