package com.example.thanhtoannoibo.Service.Voucher;

import com.example.thanhtoannoibo.Common.UserVoucherStatus;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Entity.Voucher.Transaction;
import com.example.thanhtoannoibo.Entity.Voucher.UserVoucher;
import com.example.thanhtoannoibo.Repository.Security.UserRepository;
import com.example.thanhtoannoibo.Repository.Voucher.UserVoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserVoucherService {

    private final UserVoucherRepository userVoucherRepository;
    private final UserRepository userRepository;

    // Tạo vé mới (Gọi sau khi giao dịch mua vé thành công)
    @Transactional
    public UserVoucher createVoucher(UUID userId, UUID serviceId, BigDecimal purchasePrice, Transaction transaction) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Tạo mã vé (Format: VOUCHER-Time-Random)
        String voucherCode = "V-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        UserVoucher voucher = UserVoucher.builder()
                .owner(user)
                .serviceId(serviceId) // Link tới dịch vụ (Cơm, Gửi xe...)
                .voucherCode(voucherCode)
                .status(UserVoucherStatus.ACTIVE) // Mặc định là có thể dùng
                .priceAtPurchase(purchasePrice)
                .purchaseTransaction(transaction) // Link tới giao dịch mua để truy vết
                .build();

        return userVoucherRepository.save(voucher);
    }

    // Lấy danh sách vé khả dụng của User
    public List<UserVoucher> getAvailableVouchers(UUID userId) {
        // Hàm này tìm theo status 'AVAILABLE' hoặc 'ACTIVE' tùy Enum bạn định nghĩa
        // Giả sử Enum UserVoucherStatus có giá trị ACTIVE tương ứng AVAILABLE
        return userVoucherRepository.findByOwner_UserIdAndStatus(userId, UserVoucherStatus.ACTIVE);
    }

    // Tìm vé theo mã (Dùng cho API check vé)
    public UserVoucher getVoucherByCode(String code) {
        return userVoucherRepository.findByVoucherCode(code)
                .orElseThrow(() -> new RuntimeException("Voucher not found"));
    }
}