package com.example.thanhtoannoibo.Repository.Wallet;
import com.example.thanhtoannoibo.Entity.Voucher.TransactionBreakdown;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
public interface TransactionBreakdownRepository extends JpaRepository<TransactionBreakdown, UUID>{
    Optional<TransactionBreakdown> findByTransaction_TransactionId(UUID transactionId);
}
