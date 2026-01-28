package com.example.thanhtoannoibo.Controller.User;

import com.example.thanhtoannoibo.DTO.Request.User.UpdateAvatarRequest;
import com.example.thanhtoannoibo.DTO.Response.Auth.UserResponse;
import com.example.thanhtoannoibo.DTO.Response.BaseResponse;
import com.example.thanhtoannoibo.Service.User.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Cập nhật ảnh đại diện của user đang đăng nhập
     */
    @PutMapping("/me/avatar")
    public BaseResponse<UserResponse> updateMyAvatar(
            @Valid @RequestBody UpdateAvatarRequest request
    ) {
        return BaseResponse.success(userService.updateMyAvatar(request));
    }
}
