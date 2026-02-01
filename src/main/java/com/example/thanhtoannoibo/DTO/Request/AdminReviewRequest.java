package com.example.thanhtoannoibo.DTO.Request;

import lombok.Data;

@Data
public class AdminReviewRequest {
    private String status;
    private String reason;
    private String reviewImageUrl;
}
