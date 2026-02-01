package com.example.thanhtoannoibo.DTO.Response.Auth;
import lombok.Builder;
import lombok.Data;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
public class RoleResponse {
    private UUID roleId;
    private String roleCode;    // VD: ADMIN
    private String roleName;    // VD: Quản trị viên
    private String description;

    // Danh sách quyền hạn thuộc vai trò này
    private Set<PermissionResponse> permissions;
}
