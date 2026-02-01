package com.example.thanhtoannoibo.DTO.Request.User;

import com.example.thanhtoannoibo.Common.UserStatus;
import com.example.thanhtoannoibo.Common.UserType;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UserFilterRequest {
    private String keyword;
    private UserStatus status;
    private String role;

    // [BỔ SUNG] Filter theo UserType (MERCHANT, USER, ADMIN...)
    private UserType userType;

    private LocalDate fromDate;
    private LocalDate toDate;
}