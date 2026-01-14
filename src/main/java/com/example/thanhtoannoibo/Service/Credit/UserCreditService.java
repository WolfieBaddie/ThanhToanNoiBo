package com.example.thanhtoannoibo.Service.Credit;

import com.example.thanhtoannoibo.Entity.Credit.UserCredit;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Repository.Credit.UserCreditRepository;
import com.example.thanhtoannoibo.Repository.Security.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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

    // Logic nạp tiền (Thay thế topUpBalance cũ)
    @Transactional
    public void addBalance(UUID userId, BigDecimal amount) {
        // Dùng khóa (Lock) để tránh race condition khi nạp tiền
        UserCredit credit = userCreditRepository.findWithLockByUser_UserId(userId)
                .orElseGet(() -> createNewCredit(userId));

        credit.addBalance(amount);
        userCreditRepository.save(credit);
    }

    // Helper: Tạo ví mới
    private UserCredit createNewCredit(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return userCreditRepository.save(UserCredit.builder()
                .user(user)
                .balance(BigDecimal.ZERO)
                .totalDeposited(BigDecimal.ZERO)
                .build());
    }
}