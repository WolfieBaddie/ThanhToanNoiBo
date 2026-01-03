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

    // Find all active counters of a specific type (e.g., all active Canteen counters)
    List<Counter> findByCounterTypeAndStatus(CounterType type, CounterStatus status);

    Optional<Counter> findByDeviceIdentifier(String deviceIdentifier);
}
