package com.example.thanhtoannoibo.DTO.Response.Transaction;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class MerchantStatsResponse {
    private BigDecimal todayRevenue;
    private BigDecimal yesterdayRevenue;
    private Double revenueGrowth; // Phần trăm tăng trưởng
    private Long orderCount;
    private Long processingCount;
    private BigDecimal avgOrderValue;
}
