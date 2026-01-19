package com.example.thanhtoannoibo.Entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications", schema = "app")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "notification_id")
    private UUID notificationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String title;
    private String message;

    // Loại thông báo: INFO, WARNING, SUCCESS (để hiển thị icon/màu sắc)
    @Column(name = "type")
    private String type;

    @Column(name = "is_read")
    private boolean isRead;

    // Link để khi bấm vào sẽ nhảy tới trang tương ứng (VD: /transactions/123)
    @Column(name = "target_url")
    private String targetUrl;

    @CreationTimestamp
    private LocalDateTime createdAt;
}