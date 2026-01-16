package com.example.thanhtoannoibo.DTO.Credit;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class UserCreditInfoResponse {
    // Số dư hiện tại
    private BigDecimal balance;

    // Tổng tiền đã nạp (để hiển thị thống kê nếu cần)
    private BigDecimal totalDeposited;

    // --- SPENDING CONTROL INFO ---

    // Hạn mức tối đa/ngày (trả về null nếu không giới hạn)
    private BigDecimal dailyLimitAmount;

    // Số tiền đã tiêu hôm nay
    private BigDecimal currentDaySpending;

    // Số tiền CÒN LẠI được phép tiêu trong hôm nay
    // (Logic: dailyLimit - currentDaySpending). Null nếu không giới hạn.
    private BigDecimal remainingDailyLimit;

    // Trạng thái hiển thị (VD: "Unlimited" hay con số cụ thể - Frontend có thể tự xử lý, nhưng BE trả về flag này cho tiện)
    @JsonProperty("isUnlimited")
    private boolean isUnlimited;
}