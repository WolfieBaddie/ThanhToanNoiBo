package com.example.thanhtoannoibo.Service.Notification;

import com.example.thanhtoannoibo.DTO.Response.Notification.NotificationResponse; // Import DTO
import com.example.thanhtoannoibo.Entity.Notification;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Repository.Notification.NotificationRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;

    @Transactional
    public void createNotification(User user, String title, String message, String type, String targetUrl) {
        Notification noti = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type != null ? type : "INFO")
                .targetUrl(targetUrl)
                .isRead(false)
                .build();
        notificationRepository.save(noti);
    }

    // [SỬA LẠI]: Trả về DTO (NotificationResponse) thay vì Entity
    public Page<NotificationResponse> getMyNotifications(User user, Pageable pageable) {
        Page<Notification> pageEntity = notificationRepository.findByUser_UserIdOrderByCreatedAtDesc(user.getUserId(), pageable);

        // Map từ Entity sang DTO để cắt đứt vòng lặp đệ quy
        return pageEntity.map(this::mapToResponse);
    }

    public long countUnread(User user) {
        return notificationRepository.countByUser_UserIdAndIsReadFalse(user.getUserId());
    }

    @Transactional
    public void markAsRead(UUID notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void markAllAsRead(User user) {
        notificationRepository.markAllAsRead(user.getUserId());
    }

    // Helper: Chuyển Entity -> DTO
    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .notificationId(notification.getNotificationId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .targetUrl(notification.getTargetUrl())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
        // Lưu ý: Không map field 'user' vào đây, hoặc chỉ map userId, userName đơn giản
    }
}