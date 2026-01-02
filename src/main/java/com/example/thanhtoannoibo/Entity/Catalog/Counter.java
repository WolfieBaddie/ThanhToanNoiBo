package com.example.thanhtoannoibo.Entity.Catalog;
import com.example.thanhtoannoibo.Common.CounterStatus;
import com.example.thanhtoannoibo.Common.CounterType;
import com.example.thanhtoannoibo.Entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "counters", schema = "app")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Counter {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "counter_id")
    private UUID counterId;

    @Column(name = "counter_code", nullable = false, unique = true)
    private String counterCode;

    @Column(name = "counter_name", nullable = false)
    private String counterName;

    @Enumerated(EnumType.STRING)
    @Column(name = "counter_type", nullable = false)
    private CounterType counterType;

    @Column(name = "location")
    private String location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "managed_by")
    private User managedBy; // The staff member responsible

    // IoT specific fields
    @Column(name = "device_identifier")
    private String deviceIdentifier;

    @Column(name = "device_model")
    private String deviceModel;

    @Column(name = "device_ip") // Postgres 'inet' maps to String in Java usually
    private String deviceIp;

    @Column(name = "last_heartbeat")
    private LocalDateTime lastHeartbeat;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private CounterStatus status = CounterStatus.ACTIVE;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
