package com.example.thanhtoannoibo.Repository.Wallet;

import com.example.thanhtoannoibo.Entity.Voucher.PaymentDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
@Repository
public interface PaymentDetailRepository extends JpaRepository<PaymentDetail, UUID>{
    List<PaymentDetail> findAllByTransaction_TransactionId(UUID transactionId);

    Optional<PaymentDetail> findByTransaction_TransactionIdAndServiceIsNullAndPackageRefIsNull(UUID transactionId);

    @Query(value = """
        SELECT 
            COALESCE(s.service_name, p.package_name, 'Dịch vụ khác') as itemName,
            SUM(pd.quantity) as totalSales
        FROM app.payment_details pd
        JOIN app.transactions t ON pd.transaction_id = t.transaction_id
        LEFT JOIN app.services s ON pd.service_id = s.service_id
        LEFT JOIN app.packages p ON pd.package_id = p.package_id
        WHERE t.payee_user_id = :merchantId
          AND t.status = 'COMPLETED'
          AND t.created_at BETWEEN :startDate AND :endDate
        GROUP BY s.service_name, p.package_name
        ORDER BY totalSales DESC
        LIMIT 5
    """, nativeQuery = true)
    List<Object[]> getTopSellingItems(@Param("merchantId") UUID merchantId,
                                      @Param("startDate") LocalDateTime startDate,
                                      @Param("endDate") LocalDateTime endDate);
}
