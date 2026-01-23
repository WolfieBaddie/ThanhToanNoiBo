package com.example.thanhtoannoibo.Repository.Wallet;

import com.example.thanhtoannoibo.Entity.Voucher.PaymentDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
@Repository
public interface PaymentDetailRepository extends JpaRepository<PaymentDetail, UUID>{
    List<PaymentDetail> findAllByTransaction_TransactionId(UUID transactionId);

    Optional<PaymentDetail> findByTransaction_TransactionIdAndServiceIsNullAndPackageRefIsNull(UUID transactionId);
}
