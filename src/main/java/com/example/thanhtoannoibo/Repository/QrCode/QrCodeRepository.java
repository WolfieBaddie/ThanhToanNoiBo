package com.example.thanhtoannoibo.Repository.QrCode;

import com.example.thanhtoannoibo.Entity.QrCode.QRCode;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository

public interface QrCodeRepository  extends JpaRepository<QRCode, UUID>{
    Optional<QRCode> findByQrCode(String qrCode);

    Optional<QRCode> findByQrCodeAndStatus(String qrCode, String status);

    @Query("SELECT q FROM QRCode q WHERE q.qrCode = :qrCode " +
            "AND q.status = 'ACTIVE' " +
            "AND (q.expiresAt IS NULL OR q.expiresAt > CURRENT_TIMESTAMP) " +
            "AND (q.usageLimit IS NULL OR q.usageCount < q.usageLimit)")
    Optional<QRCode> findActiveQRCode(@Param("qrCode") String qrCode);

    // --- NEW: FOR UPDATING USAGE COUNTS ---
    // Locks the QR row to safely increment usage_count
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT q FROM QRCode q WHERE q.qrCode = :qrCode")
    Optional<QRCode> findByQrCodeForUpdate(@Param("qrCode") String qrCode);
}
