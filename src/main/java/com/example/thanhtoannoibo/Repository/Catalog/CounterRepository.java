package com.example.thanhtoannoibo.Repository.Catalog;
import com.example.thanhtoannoibo.Common.CounterStatus;
import com.example.thanhtoannoibo.Common.CounterType;
import com.example.thanhtoannoibo.Entity.Catalog.Counter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
public interface CounterRepository extends JpaRepository<Counter, UUID>{
    Optional<Counter> findByCounterCode(String counterCode);

    // Find all active counters of a specific type
    List<Counter> findByCounterTypeAndStatus(String type, String status); // Lưu ý: type/status trong DB là String

    Optional<Counter> findByDeviceIdentifier(String deviceIdentifier);

    // [MỚI] Tìm quầy theo ID của người quản lý (Merchant)
    // Spring JPA sẽ tự động hiểu: Tìm Counter có field managedBy, và managedBy có userId = tham số truyền vào
    Optional<Counter> findByManagedBy_UserId(UUID userId);
}
