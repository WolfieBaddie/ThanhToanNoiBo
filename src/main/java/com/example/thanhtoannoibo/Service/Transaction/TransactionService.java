package com.example.thanhtoannoibo.Service.Transaction;

import com.example.thanhtoannoibo.Common.ErrorCode;
import com.example.thanhtoannoibo.Common.TransactionStatus;
import com.example.thanhtoannoibo.Common.TransactionType;
import com.example.thanhtoannoibo.Entity.Credit.UserCredit;
import com.example.thanhtoannoibo.Entity.Voucher.Transaction;
import com.example.thanhtoannoibo.Exception.AppException;
import com.example.thanhtoannoibo.Repository.Wallet.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;

    // Giữ nguyên, không cần sửa gì thêm so với lần trước
    public Transaction initiateTransaction(UserCredit credit, String txnRef, BigDecimal amount, String description, Map<String, Object> metadata) {
        Transaction txn = Transaction.builder()
                .transactionRef(txnRef)
                .transactionType(TransactionType.DEPOSIT)
                .credit(credit)
                .amount(amount)
                .balanceAfter(credit.getBalance())
                .status(TransactionStatus.PENDING)
                .description(description)
                .metadata(metadata)
                .createdAt(LocalDateTime.now())
                .build();
        return transactionRepository.save(txn);
    }

    // 2. Hoàn tất Transaction (Gọi khi VNPay callback thành công/thất bại)
    @Transactional
    public void completeTransaction(UUID transactionId, TransactionStatus status, BigDecimal newBalance) {
        Transaction txn = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));

        txn.setStatus(status);

        // Chỉ cập nhật số dư cuối cùng nếu thành công
        if (status == TransactionStatus.COMPLETED) {
            txn.setBalanceAfter(newBalance);
        }

        transactionRepository.save(txn);
    }

    // 3. Tìm theo Ref
    public Transaction findByRef(String txnRef) {
        return transactionRepository.findByTransactionRef(txnRef)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));
    }
}