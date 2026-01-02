package com.example.thanhtoannoibo.Repository.Transfer;
import com.example.thanhtoannoibo.Entity.Transfer.TransferRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface TransferRequestRepository extends JpaRepository<TransferRequest, UUID>{
    List<TransferRequest> findByQrId(UUID qrId);

    List<TransferRequest> findBySenderWalletId(UUID senderWalletId);

    List<TransferRequest> findByReceiverWalletId(UUID receiverWalletId);

    @Query("SELECT t FROM TransferRequest t WHERE t.status = 'PENDING' AND t.expiresAt < :now")
    List<TransferRequest> findExpiredRequests(@Param("now") LocalDateTime now);
}
