package com.example.thanhtoannoibo.Repository.Wallet;

import com.example.thanhtoannoibo.Entity.Voucher.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {

    // Tìm giao dịch theo mã tham chiếu (duy nhất)
    Optional<Transaction> findByTransactionRef(String transactionRef);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
            "WHERE t.payee.userId = :merchantId " +
            "AND t.createdAt BETWEEN :startDate AND :endDate " +
            "AND t.status = 'COMPLETED' " +
            "AND (t.transactionType = 'REDEMPTION')") // Chỉ tính giao dịch bán hàng
    BigDecimal sumRevenueByDateRange(@Param("merchantId") UUID merchantId,
                                     @Param("startDate") LocalDateTime startDate,
                                     @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(t) FROM Transaction t " +
            "WHERE t.payee.userId = :merchantId " +
            "AND t.createdAt BETWEEN :startDate AND :endDate " +
            "AND t.status = 'COMPLETED'")
    long countOrdersByDateRange(@Param("merchantId") UUID merchantId,
                                @Param("startDate") LocalDateTime startDate,
                                @Param("endDate") LocalDateTime endDate);

    @Query(value = """
        SELECT 
            CAST(t.created_at AS DATE) as txnDate, 
            SUM(t.amount) as totalAmount
        FROM app.transactions t
        WHERE t.payee_user_id = :merchantId 
          AND t.status = 'COMPLETED'
          AND (t.transaction_type = 'PAYMENT' OR t.transaction_type = 'REDEMPTION')
          AND t.created_at BETWEEN :startDate AND :endDate
        GROUP BY CAST(t.created_at AS DATE)
        ORDER BY txnDate ASC
    """, nativeQuery = true)
    List<Object[]> getDailyRevenueStats(@Param("merchantId") UUID merchantId,
                                        @Param("startDate") LocalDateTime startDate,
                                        @Param("endDate") LocalDateTime endDate);
}