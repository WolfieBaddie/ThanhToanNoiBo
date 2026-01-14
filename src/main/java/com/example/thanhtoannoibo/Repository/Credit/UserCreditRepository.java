package com.example.thanhtoannoibo.Repository.Credit;
import com.example.thanhtoannoibo.Entity.Credit.UserCredit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserCreditRepository extends JpaRepository<UserCredit, UUID> {
    // Tìm ví xu của user theo ID
    Optional<UserCredit> findByUser_UserId(UUID userId);

    // Tìm và KHÓA dòng dữ liệu (Pessimistic Lock) để xử lý giao dịch an toàn
    // Dùng khi nạp tiền hoặc trừ tiền để tránh Race Condition (nhiều request trừ tiền cùng lúc)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<UserCredit> findWithLockByUser_UserId(UUID userId);
}
