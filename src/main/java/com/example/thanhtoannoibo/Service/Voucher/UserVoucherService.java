package com.example.thanhtoannoibo.Service.Voucher;
import com.example.thanhtoannoibo.Entity.Voucher.UserVoucher;
import com.example.thanhtoannoibo.Repository.Voucher.UserVoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserVoucherService {
    private final UserVoucherRepository userVoucherRepository;

    // Tìm ví chính đang hoạt động của User
    public UserVoucher getUserActiveWallet(UUID userId) {
        return userVoucherRepository.findByOwner_UserIdAndStatus(userId, "ACTIVE")
                .orElseThrow(() -> new RuntimeException("User does not have an active wallet voucher"));
    }

    // Logic cộng tiền vào ví (sẽ được gọi khi Transaction thành công)
    @Transactional
    public void topUpBalance(UUID voucherId, BigDecimal amount) {
        UserVoucher voucher = userVoucherRepository.findById(voucherId)
                .orElseThrow(() -> new RuntimeException("Voucher not found"));

        // Cộng dồn balance
        voucher.setBalance(voucher.getBalance().add(amount));
        userVoucherRepository.save(voucher);
    }
}
