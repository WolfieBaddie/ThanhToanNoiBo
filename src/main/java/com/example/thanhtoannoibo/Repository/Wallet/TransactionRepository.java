package com.example.thanhtoannoibo.Repository.Wallet;

import com.example.thanhtoannoibo.Entity.Voucher.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {

    // Tìm giao dịch theo mã tham chiếu (duy nhất)
    Optional<Transaction> findByTransactionRef(String transactionRef);

    // --- FIX: Sửa tên hàm để map đúng với quan hệ Entity ---

    // Lấy lịch sử giao dịch của một Ví Xu cụ thể
    // Transaction.credit -> UserCredit.creditId
    List<Transaction> findByCredit_CreditId(UUID creditId);

    // Lấy toàn bộ lịch sử giao dịch của một User (thông qua Ví Xu của họ)
    // Transaction.credit -> UserCredit.user -> User.userId
    List<Transaction> findByCredit_User_UserId(UUID userId);

    // Lấy lịch sử giao dịch liên quan đến 1 QR Code cụ thể
    // Transaction.qrCode -> QRCode.qrId
    List<Transaction> findByQrCode_QrId(UUID qrId);
}