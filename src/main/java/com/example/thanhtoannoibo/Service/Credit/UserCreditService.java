package com.example.thanhtoannoibo.Service.Credit;

import com.example.thanhtoannoibo.Common.ErrorCode;
import com.example.thanhtoannoibo.Entity.Credit.UserCredit;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Exception.AppException;
import com.example.thanhtoannoibo.Repository.Credit.UserCreditRepository;
import com.example.thanhtoannoibo.Repository.Security.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserCreditService {

    private final UserCreditRepository userCreditRepository;
    private final UserRepository userRepository;

    // Lấy Ví Xu của User (Nếu chưa có thì tự tạo mới)
    public UserCredit getUserCredit(UUID userId) {
        return userCreditRepository.findByUser_UserId(userId)
                .orElseGet(() -> createNewCredit(userId));
    }

    @Transactional
    public void addBalance(UUID userId, BigDecimal amount) {
        UserCredit credit = userCreditRepository.findWithLockByUser_UserId(userId)
                .orElseGet(() -> createNewCredit(userId));
        credit.addBalance(amount);
        userCreditRepository.save(credit);
    }

    @Transactional
    public UserCredit deductBalance(UUID userId, BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.INVALID_AMOUNT);
        }

        UserCredit credit = getUserCredit(userId);

        if (credit.getBalance().compareTo(amount) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
        }

        if (credit.getDailyLimitAmount() != null) {
            throw new AppException(ErrorCode.DAILY_LIMIT_EXCEEDED);
        }

        // Trừ tiền
        credit.setBalance(credit.getBalance().subtract(amount));

        // Update chi tiêu trong ngày
        BigDecimal currentSpent = credit.getCurrentDaySpending() == null ? BigDecimal.ZERO : credit.getCurrentDaySpending();
        credit.setCurrentDaySpending(currentSpent.add(amount));
        credit.setLastSpendingDate(LocalDate.now());
        credit.setLastUpdatedAt(LocalDateTime.now());

        return userCreditRepository.save(credit);
    }

    // --- UPDATE: Khởi tạo giá trị mặc định cho Spending Control ---
    private UserCredit createNewCredit(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return userCreditRepository.save(UserCredit.builder()
                .user(user)
                .balance(BigDecimal.ZERO)
                .totalDeposited(BigDecimal.ZERO)

                // Mặc định: Không giới hạn (null), đã tiêu 0, ngày hôm nay
                .dailyLimitAmount(null)
                .currentDaySpending(BigDecimal.ZERO)
                .lastSpendingDate(LocalDate.now())
                .build());
    }

    /**
     * API cho phép Phụ huynh cập nhật hạn mức (Gọi từ Controller)
     */
    @Transactional
    public void updateDailyLimit(UUID userId, BigDecimal limit) {
        UserCredit credit = getUserCredit(userId);
        // Nếu limit <= 0 hoặc null nghĩa là bỏ giới hạn
        if (limit != null && limit.compareTo(BigDecimal.ZERO) <= 0) {
            credit.setDailyLimitAmount(null);
        } else {
            credit.setDailyLimitAmount(limit);
        }
        userCreditRepository.save(credit);
    }
}