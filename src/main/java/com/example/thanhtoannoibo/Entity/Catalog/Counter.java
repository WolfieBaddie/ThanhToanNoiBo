package com.example.thanhtoannoibo.Entity.Catalog;

import com.example.thanhtoannoibo.Entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "counters", schema = "app")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Counter {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "counter_id")
    private UUID counterId;

    @Column(name = "counter_code", nullable = false, unique = true)
    private String counterCode;

    @Column(name = "counter_name", nullable = false)
    private String counterName;

    // Loại: CANTEEN, PARKING, KIOSK...
    @Column(name = "counter_type", nullable = false)
    private String counterType;

    @Column(name = "location")
    private String location;

    @Column(name = "device_identifier") // ID thiết bị phần cứng (nếu có)
    private String deviceIdentifier;

    @Column(name = "device_ip")
    private String deviceIp;

    @Column(name = "status", nullable = false)
    private String status; // ACTIVE, INACTIVE, MAINTENANCE

    // Người quản lý quầy (Merchant)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "managed_by")
    private User managedBy;

    @Column(name = "last_heartbeat")
    private LocalDateTime lastHeartbeat;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}