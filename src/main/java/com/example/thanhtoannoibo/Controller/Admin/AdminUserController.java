package com.example.thanhtoannoibo.Controller.Admin;

import com.example.thanhtoannoibo.Common.UserStatus;
import com.example.thanhtoannoibo.DTO.Request.User.UserFilterRequest;
import com.example.thanhtoannoibo.DTO.Response.BaseResponse;
import com.example.thanhtoannoibo.DTO.Response.PageResponse;
import com.example.thanhtoannoibo.DTO.Response.Auth.UserResponse;
import com.example.thanhtoannoibo.Service.User.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
// @PreAuthorize("hasRole('ADMIN')") // Bật lên nếu đã cấu hình Security
public class AdminUserController {

    private final UserService userService;

    // 1. Lấy danh sách users
    @GetMapping
    public BaseResponse<PageResponse<UserResponse>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        UserFilterRequest filter = new UserFilterRequest();
        filter.setKeyword(keyword);
        filter.setStatus(status);
        filter.setRole(role);

        // Mặc định sort theo ngày tạo mới nhất
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        return BaseResponse.success(userService.getUsers(filter, pageable));
    }

    // 2. Xem chi tiết user
    @GetMapping("/{id}")
    public BaseResponse<UserResponse> getUserDetail(@PathVariable UUID id) {
        return BaseResponse.success(userService.getUserDetail(id));
    }
}