package com.example.thanhtoannoibo.DTO.Response.Transaction;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardChartResponse {
    private List<ChartDataPoint> revenueChart; // Dữ liệu biểu đồ
    private List<TopItemData> topItems;        // Dữ liệu món bán chạy

    @Data
    @AllArgsConstructor
    public static class ChartDataPoint {
        private String date;      // Ngày (YYYY-MM-DD)
        private String dayName;   // Tên thứ (T2, T3...)
        private BigDecimal value; // Doanh thu
    }

    @Data
    @AllArgsConstructor
    public static class TopItemData {
        private String itemName;
        private Long sales;       // Số lượng bán
        private String trend;     // "up" | "down" (Có thể hardcode hoặc tính toán phức tạp sau)
    }
}