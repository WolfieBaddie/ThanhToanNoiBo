package com.example.thanhtoannoibo.DTO.Response.Counter;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CounterResponse {
    private UUID counterId;
    private String counterCode;
    private String counterName;
    private String counterType;
    private String location;
    private String status;
    private String managedByUsername; // Tên user quản lý
    private String managedByFullName;
    private LocalDateTime lastHeartbeat;
    private LocalDateTime createdAt;
}
