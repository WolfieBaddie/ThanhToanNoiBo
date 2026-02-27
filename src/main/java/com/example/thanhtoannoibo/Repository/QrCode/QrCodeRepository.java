package com.example.thanhtoannoibo.Repository.QrCode;

import com.example.thanhtoannoibo.Common.QrCodeStatus;
import com.example.thanhtoannoibo.Common.QrCodeType;
import com.example.thanhtoannoibo.Entity.QrCode.QRCode;
import com.example.thanhtoannoibo.Entity.Voucher.UserVoucher;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QrCodeRepository extends JpaRepository<QRCode, UUID> {
    @Modifying
    @Query("UPDATE QRCode q SET q.status = :status WHERE q.owner.userId = :userId")
    void updateStatusByUserId(@Param("userId") UUID userId, @Param("status") QrCodeStatus status);

    // FIX 1: Rename findByQrCode -> findByCodeString
    Optional<QRCode> findByCodeString(String codeString);

    // FIX 2: Check your Entity for "type" vs "qrType"
    // If your Entity has a field "User owner", use "Owner_Id"
    // If your Entity has a field "QrCodeType type", use "Type"
    boolean existsByOwner_UserIdAndTypeAndStatus(UUID ownerId, QrCodeType type, QrCodeStatus status);

    // FIX 3: Rename findByQrCodeAndStatus -> findByCodeStringAndStatus
    Optional<QRCode> findByCodeStringAndStatus(String codeString, String status);

    boolean existsByPayerVoucher_VoucherIdAndStatus(UUID voucherId, QrCodeStatus status);

    // FIX 4: Update JPQL to use q.codeString
    @Query("SELECT q FROM QRCode q WHERE q.codeString = :codeString " +
            "AND q.status = 'ACTIVE' " +
            "AND (q.expiresAt IS NULL OR q.expiresAt > CURRENT_TIMESTAMP) " +
            "AND (q.usageLimit IS NULL OR q.usageCount < q.usageLimit)")
    Optional<QRCode> findActiveQRCode(@Param("codeString") String codeString);

    // FIX 5: Update JPQL to use q.codeString
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT q FROM QRCode q WHERE q.codeString = :codeString " +
            "AND q.status = 'ACTIVE' " +
            "AND (q.expiresAt IS NULL OR q.expiresAt > CURRENT_TIMESTAMP) " +
            "AND (q.usageLimit IS NULL OR q.usageCount < q.usageLimit)")
    Optional<QRCode> findActiveQRCodeForUpdate(@Param("codeString") String codeString);

    Optional<QRCode> findFirstByPayerVoucherAndExpiresAtBefore(UserVoucher payerVoucher, LocalDateTime now);

    @Modifying
    @Query("UPDATE QRCode q SET q.status = :status WHERE q.payerVoucher.voucherId IN :voucherIds AND q.status = 'ACTIVE'")
    void lockQrCodesByVoucherIds(@Param("voucherIds") List<UUID> voucherIds, @Param("status") QrCodeStatus status);
}