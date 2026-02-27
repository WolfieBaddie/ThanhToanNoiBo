package com.example.thanhtoannoibo.Repository.Voucher;

import com.example.thanhtoannoibo.Entity.Voucher.UserVoucher;
import com.example.thanhtoannoibo.Entity.Voucher.UserVoucherDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserVoucherDetailRepository extends JpaRepository<UserVoucherDetail, UUID> {

    /**
     * Tìm danh sách chi tiết theo Voucher cha (UserVoucher)
     * Dùng khi hiển thị chi tiết vé hoặc khi quét QR để biết vé này có những món gì.
     */
    List<UserVoucherDetail> findByUserVoucher(UserVoucher userVoucher);

    /**
     * Tìm danh sách chi tiết theo Voucher ID
     */
    List<UserVoucherDetail> findByUserVoucher_VoucherId(UUID voucherId);

    /**
     * Tìm chi tiết cụ thể của một món trong Voucher
     * Dùng khi muốn check xem món X trong Voucher Y còn số lượng không
     */
    @Query("SELECT d FROM UserVoucherDetail d " +
            "WHERE d.userVoucher.voucherId = :voucherId " +
            "AND d.service.serviceId = :serviceId")
    Optional<UserVoucherDetail> findDetailByVoucherAndService(
            @Param("voucherId") UUID voucherId,
            @Param("serviceId") UUID serviceId
    );

    /**
     * Lấy các item còn lượt sử dụng (remaining > 0) của một voucher
     * Dùng cho việc hiển thị danh sách "Khả dụng" khi quét QR
     */
    @Query("SELECT d FROM UserVoucherDetail d " +
            "WHERE d.userVoucher.voucherId = :voucherId " +
            "AND d.remainingQuantity > 0")
    List<UserVoucherDetail> findAvailableItems(@Param("voucherId") UUID voucherId);
}