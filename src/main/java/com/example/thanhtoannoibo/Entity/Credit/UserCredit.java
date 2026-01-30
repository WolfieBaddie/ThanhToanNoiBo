package com.example.thanhtoannoibo.Entity.Credit;

import com.example.thanhtoannoibo.Common.CreditStatus;
import com.example.thanhtoannoibo.Common.ErrorCode;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Exception.AppException; // Sử dụng Exception chuẩn của App
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_credits", schema = "app")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserCredit {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "credit_id")
    private UUID creditId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "balance", nullable = false)
    private BigDecimal balance;

    @Column(name = "total_deposited")
    private BigDecimal totalDeposited;

    // --- CÁC TRƯỜNG MỚI CHO SPENDING CONTROL ---
    @Column(name = "daily_limit_amount")
    private BigDecimal dailyLimitAmount; // Hạn mức tối đa/ngày (Null = không giới hạn)

    @Column(name = "current_day_spending")
    private BigDecimal currentDaySpending; // Đã tiêu hôm nay

    @Column(name = "last_spending_date")
    private LocalDate lastSpendingDate; // Ngày tiêu gần nhất
    // -------------------------------------------

    @UpdateTimestamp
    @Column(name = "last_updated_at")
    private LocalDateTime lastUpdatedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private CreditStatus status = CreditStatus.ACTIVE;

    // --- BUSINESS LOGIC ---

    public void addBalance(BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.INVALID_AMOUNT);
        }
        this.balance = this.balance.add(amount);
        this.totalDeposited = (this.totalDeposited == null ? BigDecimal.ZERO : this.totalDeposited).add(amount);
    }

    /**
     * Trừ tiền (Kèm logic kiểm tra hạn mức ngày)
     */
    public void deductBalance(BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.INVALID_AMOUNT);
        }

        // 1. Kiểm tra số dư tổng
        if (this.balance.compareTo(amount) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
        }

        // 2. Logic Reset hạn mức ngày
        LocalDate today = LocalDate.now();
        // Nếu ngày giao dịch cuối cùng khác hôm nay (hoặc chưa có) -> Reset về 0
        if (this.lastSpendingDate == null || !this.lastSpendingDate.isEqual(today)) {
            this.currentDaySpending = BigDecimal.ZERO;
            this.lastSpendingDate = today;
        }

        // 3. Kiểm tra Hạn mức ngày (Chỉ check nếu dailyLimitAmount != null)
        if (this.dailyLimitAmount != null) {
            BigDecimal potentialSpending = this.currentDaySpending.add(amount);
            if (potentialSpending.compareTo(this.dailyLimitAmount) > 0) {
                throw new AppException(ErrorCode.DAILY_LIMIT_EXCEEDED);
            }
        }

        // 4. Thực hiện trừ tiền
        this.balance = this.balance.subtract(amount);

        // 5. Cập nhật chi tiêu trong ngày
        this.currentDaySpending = this.currentDaySpending.add(amount);
    }
}