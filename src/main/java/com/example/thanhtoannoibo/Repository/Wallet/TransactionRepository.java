package com.example.thanhtoannoibo.Repository.Wallet;

import com.example.thanhtoannoibo.Entity.Voucher.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID>{

    Optional<Transaction> findByTransactionRef(String transactionRef);

    // ĐÃ SỬA: Không còn tìm theo PayerVoucher nữa vì quan hệ đã bị cắt.
    // Thay vào đó tìm theo Credit ID (Ví Xu)
    List<Transaction> findByCreditId(UUID creditId);

    // Lấy lịch sử giao dịch liên quan đến 1 QR Code cụ thể
    List<Transaction> findByQrCodeQrId(UUID qrId);

    // Lấy lịch sử giao dịch mua vé của user (nếu cần join bảng)
    // @Query("SELECT t FROM Transaction t WHERE t.creditId IN (SELECT c.creditId FROM UserCredit c WHERE c.userId = :userId)")
    // List<Transaction> findByUserId(UUID userId);
}