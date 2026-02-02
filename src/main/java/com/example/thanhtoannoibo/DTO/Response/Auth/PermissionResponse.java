package com.example.thanhtoannoibo.DTO.Response.Auth;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PermissionResponse {
    private String permissionCode; // VD: USER_READ
    private String permissionName; // VD: Xem danh sách người dùng
    private String resourceType;   // VD: USER
    private String action;         // VD: READ
}
