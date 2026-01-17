package com.example.thanhtoannoibo.Repository.Catalog;
import com.example.thanhtoannoibo.Entity.Catalog.AppService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppServiceRepository extends JpaRepository<AppService, UUID> {

    Optional<AppService> findByServiceCode(String serviceCode);

    List<AppService> findAllByIsActiveTrue();

    // Mới: Tìm service dựa vào Category Code (Query join bảng)
    List<AppService> findByCategory_CategoryCodeAndIsActiveTrue(String categoryCode);

    // Mới: Tìm service dựa vào Category ID
    List<AppService> findByCategory_CategoryId(UUID categoryId);
}