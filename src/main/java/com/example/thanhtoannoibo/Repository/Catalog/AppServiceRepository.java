package com.example.thanhtoannoibo.Repository.Catalog;
import com.example.thanhtoannoibo.Common.ServiceCategory;
import com.example.thanhtoannoibo.Entity.Catalog.AppService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppServiceRepository extends JpaRepository<AppService, UUID>{
    Optional<AppService> findByServiceCode(String serviceCode);

    List<AppService> findByServiceCategoryAndIsActiveTrue(ServiceCategory category);

    boolean existsByServiceCode(String serviceCode);

    List<AppService> findAllByIsActiveTrue();
}
