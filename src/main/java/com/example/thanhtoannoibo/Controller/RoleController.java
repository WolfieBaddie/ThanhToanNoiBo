package com.example.thanhtoannoibo.Controller;
import com.example.thanhtoannoibo.DTO.Response.Auth.RoleResponse;
import com.example.thanhtoannoibo.DTO.Response.BaseResponse;
import com.example.thanhtoannoibo.Service.Security.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/roles") // Hoặc /api/admin/roles tùy bạn
@RequiredArgsConstructor
public class RoleController {
    private final RoleService roleService;

    // API: Lấy danh sách Role và Quyền hạn
    @GetMapping
    public ResponseEntity<BaseResponse<List<RoleResponse>>> getAllRoles() {
        List<RoleResponse> roles = roleService.getAllRoles();
        return ResponseEntity.ok(BaseResponse.success(roles, "Lấy danh sách vai trò thành công"));
    }
}
