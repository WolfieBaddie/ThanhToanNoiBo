package com.example.thanhtoannoibo.Entity.Credit;
import com.example.thanhtoannoibo.Entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
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

    // Quan hệ 1-1: Một User chỉ có một "Kho Xu" duy nhất
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "balance", nullable = false)
    private BigDecimal balance; // Số dư Xu khả dụng (Ví dụ: 50,000 Xu)

    @Column(name = "total_deposited")
    private BigDecimal totalDeposited; // Tổng Xu đã nạp từ trước đến nay (để thống kê hạng thành viên nếu cần)

    @UpdateTimestamp
    @Column(name = "last_updated_at")
    private LocalDateTime lastUpdatedAt;

    // --- Helper Methods cho Business Logic ---

    // Nạp xu (Cộng tiền)
    public void addBalance(BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số tiền nạp phải lớn hơn 0");
        }
        this.balance = this.balance.add(amount);
        // Cập nhật luôn tổng nạp tích lũy
        this.totalDeposited = (this.totalDeposited == null ? BigDecimal.ZERO : this.totalDeposited).add(amount);
    }

    // Trừ xu (Thanh toán/Mua vé)
    public void deductBalance(BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số tiền trừ phải lớn hơn 0");
        }
        if (this.balance.compareTo(amount) < 0) {
            throw new RuntimeException("Số dư Xu không đủ để thực hiện giao dịch!");
        }
        this.balance = this.balance.subtract(amount);
    }
}
