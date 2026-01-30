package com.example.thanhtoannoibo.Repository.Voucher;

import com.example.thanhtoannoibo.Common.UserVoucherStatus;
import com.example.thanhtoannoibo.Entity.Voucher.UserVoucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserVoucherRepository extends JpaRepository<UserVoucher, UUID>, JpaSpecificationExecutor<UserVoucher> {

    // 1. Khóa theo User Owner (Vẫn dùng v.owner.userId vì owner là relationship @ManyToOne)
    @Modifying
    @Query("UPDATE UserVoucher v SET v.status = :status WHERE v.owner.userId = :userId")
    void updateStatusByUserId(@Param("userId") UUID userId, @Param("status") UserVoucherStatus status);

    // Tìm theo Code
    Optional<UserVoucher> findByVoucherCode(String voucherCode);

    // 2. [FIXED] Khóa theo Service ID
    // Logic:
    // - Check trường serviceId trực tiếp trong UserVoucher (cho vé lẻ)
    // - HOẶC dùng subquery kiểm tra trong UserVoucherDetail (cho vé gộp/combo) nếu có bảng detail
    @Modifying
    @Query("UPDATE UserVoucher v SET v.status = :status " +
            "WHERE v.status = 'ACTIVE' " +
            "AND (" +
            "   v.serviceId IN :serviceIds " + // Sửa: Dùng trực tiếp field UUID
            "   OR v.voucherId IN (" +
            "       SELECT d.userVoucher.voucherId FROM UserVoucherDetail d WHERE d.service.serviceId IN :serviceIds" +
            "   )" +
            ")")
    void updateStatusByServiceIds(@Param("serviceIds") List<UUID> serviceIds, @Param("status") UserVoucherStatus status);

    // 3. [FIXED] Khóa theo Package ID
    // Sửa: Dùng v.packageId thay vì v.appPackage.packageId
    @Modifying
    @Query("UPDATE UserVoucher v SET v.status = :status WHERE v.packageId IN :packageIds AND v.status = 'ACTIVE'")
    void updateStatusByPackageIds(@Param("packageIds") List<UUID> packageIds, @Param("status") UserVoucherStatus status);

    // --- Các method tìm kiếm khác ---
    List<UserVoucher> findByOwner_UserIdAndStatus(UUID userId, UserVoucherStatus status);

    List<UserVoucher> findByOwner_UserId(UUID userId);

    Optional<UserVoucher> findByPurchaseTransaction_TransactionId(UUID transactionId);

    @Query("SELECT DISTINCT v FROM UserVoucher v " +
            "LEFT JOIN UserVoucherDetail d ON d.userVoucher.voucherId = v.voucherId " +
            "WHERE v.status = 'ACTIVE' " +
            "AND (v.serviceId IN :serviceIds OR d.service.serviceId IN :serviceIds)")
    List<UserVoucher> findActiveVouchersByServiceIds(@Param("serviceIds") List<UUID> serviceIds);

    List<UserVoucher> findByPackageIdAndStatus(UUID packageId, UserVoucherStatus status);
}