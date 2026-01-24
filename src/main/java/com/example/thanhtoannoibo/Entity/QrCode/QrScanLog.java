package com.example.thanhtoannoibo.Entity.QrCode;
import com.example.thanhtoannoibo.Entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "qr_scan_logs", schema = "app")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QrScanLog {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "scan_id")
    private UUID scanId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "qr_id") // Có thể null nếu mã bậy
    private QRCode qrCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scanned_by")
    private User scannedBy; // Ai quét? (Thường là merchant)

    @Column(name = "scan_result", nullable = false)
    private String scanResult; // 'SUCCESS', 'FAILED'

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    @Column(name = "ip_address")
    private String ipAddress;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "device_info")
    private Map<String, Object> deviceInfo;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "image_url")
    private String imageUrl;
}
