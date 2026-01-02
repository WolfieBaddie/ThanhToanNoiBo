package com.example.thanhtoannoibo.Repository.Wallet;

import com.example.thanhtoannoibo.Entity.Wallet.Wallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, UUID> {
    Optional<Wallet> findByUserId(UUID userId);

    boolean existsByUserId(UUID userId);

    @Query("SELECT w FROM Wallet w WHERE w.userId = :userId AND w.status = 'ACTIVE'")
    Optional<Wallet> findActiveWalletByUserId(@Param("userId") UUID userId);

    // --- NEW: CRITICAL FOR TRANSFERS ---
    // Locks the wallet row for writing. Use this when calculating new balance.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Wallet w WHERE w.walletId = :walletId")
    Optional<Wallet> findByIdForUpdate(@Param("walletId") UUID walletId);
}