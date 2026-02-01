package com.example.thanhtoannoibo.Controller;

import com.example.thanhtoannoibo.DTO.Request.User.UpdateUserProfileRequest;
import com.example.thanhtoannoibo.DTO.Response.Auth.UserResponse;
import com.example.thanhtoannoibo.DTO.Response.BaseResponse;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Service.Security.AuthService;
import com.example.thanhtoannoibo.Service.User.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuthService authService;

    @GetMapping("/detail")
    public ResponseEntity<BaseResponse<UserResponse>> getUserDetail(HttpServletRequest request) {
        // 1. Lấy User hiện tại từ Token/Cookie thông qua AuthService
        // Hàm này sẽ throw Exception nếu token lỗi hoặc user không tồn tại
        User currentUser = authService.getCurrentUser(request);

        // 2. Gọi Service để lấy thông tin chi tiết (Service sẽ map Entity -> DTO)
        // Truyền ID của user vừa lấy được từ token vào
        UserResponse response = userService.getUserDetail(currentUser.getUserId());

        return ResponseEntity.ok(BaseResponse.success(response));
    }

    // API: Cập nhật thông tin chính chủ (Yêu cầu đăng nhập)
    @PutMapping("/me")
    public ResponseEntity<BaseResponse<UserResponse>> updateMyProfile(
            HttpServletRequest request,
            @RequestBody @Valid UpdateUserProfileRequest updateRequest
    ) {
        // 1. Lấy User hiện tại từ Token/Cookie thông qua AuthService
        // Hàm này sẽ throw Exception nếu token lỗi hoặc user không tồn tại
        User currentUser = authService.getCurrentUser(request);

        // 2. Truyền thẳng User Entity vào Service để xử lý logic update
        UserResponse updatedUser = userService.updateUserProfile(currentUser, updateRequest);

        return ResponseEntity.ok(BaseResponse.success(updatedUser, "Cập nhật thông tin thành công"));
    }
}