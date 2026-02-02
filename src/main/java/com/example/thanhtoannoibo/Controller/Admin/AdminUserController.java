package com.example.thanhtoannoibo.Controller.Admin;

import com.example.thanhtoannoibo.Common.UserStatus;
import com.example.thanhtoannoibo.Common.UserType;
import com.example.thanhtoannoibo.DTO.Request.User.CreateUserRequest;
import com.example.thanhtoannoibo.DTO.Request.User.UpdateUserRequest;
import com.example.thanhtoannoibo.DTO.Request.User.UserFilterRequest;
import com.example.thanhtoannoibo.DTO.Response.Auth.UserResponse;
import com.example.thanhtoannoibo.DTO.Response.BaseResponse;
import com.example.thanhtoannoibo.DTO.Response.PageResponse;
import com.example.thanhtoannoibo.Service.User.Manager.AdminUserManager; // [CẬP NHẬT] Dùng Manager
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    // [CẬP NHẬT] Inject Manager thay vì Service
    private final AdminUserManager adminUserManager;

    // 1. Lấy danh sách users (Có filter UserType)
    @GetMapping
    public BaseResponse<PageResponse<UserResponse>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) UserType userType, // [BỔ SUNG] Param userType
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        UserFilterRequest filter = new UserFilterRequest();
        filter.setKeyword(keyword);
        filter.setStatus(status);
        filter.setRole(role);
        filter.setUserType(userType); // Set vào filter
        filter.setFromDate(fromDate);
        filter.setToDate(toDate);

        // Mặc định sort theo ngày tạo mới nhất
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        // Gọi qua Manager
        return BaseResponse.success(adminUserManager.getUsers(filter, pageable));
    }

    // 2. Xem chi tiết user
    @GetMapping("/{id}")
    public BaseResponse<UserResponse> getUserDetail(@PathVariable UUID id) {
        return BaseResponse.success(adminUserManager.getUserDetail(id));
    }

    @PostMapping
    public BaseResponse<UserResponse> createUser(@RequestBody @Valid CreateUserRequest request) {
        return BaseResponse.success(adminUserManager.createUser(request));
    }

    @PutMapping("/{id}")
    public BaseResponse<UserResponse> updateUser(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateUserRequest request
    ) {
        return BaseResponse.success(adminUserManager.updateUser(id, request));
    }

    @DeleteMapping("/{id}")
    public BaseResponse<String> deleteUser(@PathVariable UUID id) {
        // Tận dụng hàm update để tái sử dụng logic Cascading Lock trong Manager
        UpdateUserRequest deleteReq = new UpdateUserRequest();
        deleteReq.setStatus(UserStatus.DELETED);

        adminUserManager.updateUser(id, deleteReq);

        return BaseResponse.success("Đã xóa người dùng và vô hiệu hóa các tài sản liên quan thành công.");
    }
}