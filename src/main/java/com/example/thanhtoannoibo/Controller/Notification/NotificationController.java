package com.example.thanhtoannoibo.Controller.Notification;

import com.example.thanhtoannoibo.DTO.Response.BaseResponse;
import com.example.thanhtoannoibo.DTO.Response.Notification.NotificationResponse;
import com.example.thanhtoannoibo.DTO.Response.PageResponse;
import com.example.thanhtoannoibo.Entity.Notification;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Service.Notification.NotificationService;
import com.example.thanhtoannoibo.Service.Security.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;
    private final AuthService authService;

    // Lấy danh sách phân trang
    @GetMapping
    public BaseResponse<PageResponse<NotificationResponse>> getMyNotifications( // [SỬA]: NotificationResponse
                                                                                HttpServletRequest request,
                                                                                @RequestParam(defaultValue = "0") int page,
                                                                                @RequestParam(defaultValue = "10") int size
    ) {
        User user = authService.getCurrentUser(request);

        // Service giờ đã trả về Page<NotificationResponse> nên không bị lỗi đệ quy nữa
        return BaseResponse.success(PageResponse.from(
                notificationService.getMyNotifications(user, PageRequest.of(page, size))
        ));
    }

    // Đếm số lượng chưa đọc (để hiển thị chấm đỏ)
    @GetMapping("/unread-count")
    public BaseResponse<Long> countUnread(HttpServletRequest request) {
        User user = authService.getCurrentUser(request);
        return BaseResponse.success(notificationService.countUnread(user));
    }

    // Đánh dấu 1 tin đã đọc
    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable UUID id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    // Đánh dấu tất cả đã đọc
    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(HttpServletRequest request) {
        User user = authService.getCurrentUser(request);
        notificationService.markAllAsRead(user);
        return ResponseEntity.ok().build();
    }
}