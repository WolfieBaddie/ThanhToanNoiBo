package com.example.thanhtoannoibo.Controller.Credit;

import com.example.thanhtoannoibo.DTO.Credit.UserCreditInfoResponse;
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
    public ResponseEntity<UserCreditInfoResponse> getUserCreditInfo(@PathVariable UUID userId) {
        // 1. Lấy Entity từ Service (Service đã có logic tự tạo mới nếu chưa có)
        UserCredit credit = userCreditService.getUserCredit(userId);

        // 2. Mapping Entity sang DTO (Kèm logic xử lý hiển thị cho ngày mới)
        UserCreditInfoResponse response = mapToResponse(credit);

        return ResponseEntity.ok(response);
    }

    // --- Helper Method: Convert Entity to DTO ---
    private UserCreditInfoResponse mapToResponse(UserCredit credit) {
        LocalDate today = LocalDate.now();
        LocalDate lastSpending = credit.getLastSpendingDate();

        // LOGIC HIỂN THỊ QUAN TRỌNG:
        // Trong DB, 'currentDaySpending' chỉ được reset khi có giao dịch trừ tiền (deductBalance).
        // Nếu hôm nay user chưa tiêu gì, DB vẫn lưu số liệu của ngày hôm qua.
        // -> Khi hiển thị lên UI, phải kiểm tra ngày. Nếu khác ngày hiện tại -> Coi như đã tiêu = 0.
        boolean isNewDay = lastSpending == null || !lastSpending.isEqual(today);
        BigDecimal realSpentToday = isNewDay ? BigDecimal.ZERO : credit.getCurrentDaySpending();

        // Tính số tiền còn lại được tiêu
        BigDecimal dailyLimit = credit.getDailyLimitAmount();
        BigDecimal remaining = null;
        boolean isUnlimited = true;

        if (dailyLimit != null) {
            isUnlimited = false;
            // Còn lại = Hạn mức - Đã tiêu thực tế
            remaining = dailyLimit.subtract(realSpentToday);
            // Đảm bảo không hiển thị số âm (nếu có lỗi logic nào đó)
            if (remaining.compareTo(BigDecimal.ZERO) < 0) {
                remaining = BigDecimal.ZERO;
            }
        }

        return UserCreditInfoResponse.builder()
                .balance(credit.getBalance()) //
                .totalDeposited(credit.getTotalDeposited()) //
                .dailyLimitAmount(dailyLimit) //
                .currentDaySpending(realSpentToday) // Giá trị đã xử lý theo ngày
                .remainingDailyLimit(remaining) // Giá trị tính toán
                .isUnlimited(isUnlimited)
                .build();
    }
}