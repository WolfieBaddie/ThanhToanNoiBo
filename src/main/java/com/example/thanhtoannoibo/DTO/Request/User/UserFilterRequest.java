package com.example.thanhtoannoibo.DTO.Request.User;

import com.example.thanhtoannoibo.Common.UserStatus;
import lombok.Data;

@Data
public class UserFilterRequest {
    private String keyword;
    private UserStatus status;
    private String role;
}