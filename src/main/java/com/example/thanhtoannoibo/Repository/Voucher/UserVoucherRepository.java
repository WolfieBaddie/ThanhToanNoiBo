package com.example.thanhtoannoibo.Repository.Voucher;

import com.example.thanhtoannoibo.Common.UserVoucherStatus;
import com.example.thanhtoannoibo.Entity.Voucher.UserVoucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserVoucherRepository extends JpaRepository<UserVoucher, UUID>, JpaSpecificationExecutor<UserVoucher> {

    // Tìm Voucher bằng mã code (Quét QR tại quầy)
    Optional<UserVoucher> findByVoucherCode(String voucherCode);

    // Tìm các vé CHƯA SỬ DỤNG của User (Thay vì tìm ví active)
    // status thường là 'AVAILABLE'
    List<UserVoucher> findByOwner_UserIdAndStatus(UUID userId, UserVoucherStatus status);

    // Lấy lịch sử tất cả vé của user (bao gồm đã dùng/hết hạn)
    List<UserVoucher> findByOwner_UserId(UUID userId);

    // Tìm vé theo Transaction mua (để check lại nếu cần)
    Optional<UserVoucher> findByPurchaseTransaction_TransactionId(UUID transactionId);
}