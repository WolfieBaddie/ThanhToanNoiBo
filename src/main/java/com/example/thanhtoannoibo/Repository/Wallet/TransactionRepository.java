package com.example.thanhtoannoibo.Repository.Wallet;
import com.example.thanhtoannoibo.Entity.Wallet.Transaction; // Assuming you create this Entity based on previous steps
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID>{
    // Find transaction by unique reference (e.g., to prevent duplicate processing)
    Optional<Transaction> findByTransactionRef(String transactionRef);

    // Get history for a specific wallet
    List<Transaction> findByWalletWalletIdOrderByCreatedAtDesc(UUID walletId);

    // Get transactions associated with a specific QR code
    List<Transaction> findByQrCodeQrId(UUID qrId);
}
