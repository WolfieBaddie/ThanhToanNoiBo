package com.example.thanhtoannoibo.Repository.Merchant;

import com.example.thanhtoannoibo.Entity.Merchant.MerchantRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface MerchantRequestRepository extends JpaRepository<MerchantRequest, UUID>, JpaSpecificationExecutor<MerchantRequest> {
    List<MerchantRequest> findByMerchantIdOrderByCreatedAtDesc(UUID merchantId);
    List<MerchantRequest> findAllByOrderByCreatedAtDesc();
    List<MerchantRequest> findByStatus(String status);
}
