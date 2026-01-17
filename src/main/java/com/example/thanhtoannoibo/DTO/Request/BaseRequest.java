package com.example.thanhtoannoibo.DTO.Request;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public abstract class BaseRequest {
    // Các thông tin metadata thường dùng cho Audit Log
    // @JsonIgnore để client không cần gửi, nhưng Controller sẽ tự set vào
    @JsonIgnore
    private String clientIp;

    @JsonIgnore
    private String userAgent;

    @JsonIgnore
    private String deviceId;

    private LocalDateTime requestTime = LocalDateTime.now();
}