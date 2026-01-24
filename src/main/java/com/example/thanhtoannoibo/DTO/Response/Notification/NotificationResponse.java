package com.example.thanhtoannoibo.DTO.Response.Notification;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class NotificationResponse {
    private UUID notificationId;
    private String title;
    private String message;
    private String type;
    private String targetUrl;
    private boolean isRead;
    private LocalDateTime createdAt;

}
