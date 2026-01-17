package com.example.thanhtoannoibo.Controller.Credit;

import com.example.thanhtoannoibo.DTO.Request.Credit.UserCreditInfoResponse;
import com.example.thanhtoannoibo.DTO.Response.BaseResponse;
import com.example.thanhtoannoibo.Entity.Credit.UserCredit;

import com.example.thanhtoannoibo.Service.Credit.UserCreditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/credits")
@RequiredArgsConstructor
public class UserCreditController {

    private final UserCreditService userCreditService;

    /**
     * Lấy thông tin ví của user
     * GET /api/v1/credits/{userId}
     */
    @GetMapping("/{userId}")
    // 2. Sửa kiểu trả về thành ResponseEntity<BaseResponse<...>>
    public ResponseEntity<BaseResponse<UserCreditInfoResponse>> getUserCreditInfo(@PathVariable UUID userId) {

        // Lấy Entity từ Service
        UserCredit credit = userCreditService.getUserCredit(userId);

        // Mapping Entity sang DTO
        UserCreditInfoResponse response = mapToResponse(credit);

        // 3. Bọc kết quả trong BaseResponse.success(...)
        return ResponseEntity.ok(BaseResponse.success(response));
    }

    // --- Helper Method: Convert Entity to DTO ---
    private UserCreditInfoResponse mapToResponse(UserCredit credit) {
        LocalDate today = LocalDate.now();
        LocalDate lastSpending = credit.getLastSpendingDate();

        // Logic reset chi tiêu ngày mới
        boolean isNewDay = lastSpending == null || !lastSpending.isEqual(today);
        BigDecimal realSpentToday = isNewDay ? BigDecimal.ZERO : credit.getCurrentDaySpending();

        // Tính số tiền còn lại được tiêu
        BigDecimal dailyLimit = credit.getDailyLimitAmount();
        BigDecimal remaining = null;
        boolean isUnlimited = true;

        if (dailyLimit != null) {
            isUnlimited = false;
            remaining = dailyLimit.subtract(realSpentToday);
            if (remaining.compareTo(BigDecimal.ZERO) < 0) {
                remaining = BigDecimal.ZERO;
            }
        }

        return UserCreditInfoResponse.builder()
                .balance(credit.getBalance())
                .totalDeposited(credit.getTotalDeposited())
                .dailyLimitAmount(dailyLimit)
                .currentDaySpending(realSpentToday)
                .remainingDailyLimit(remaining)
                .isUnlimited(isUnlimited)
                .build();
    }
}