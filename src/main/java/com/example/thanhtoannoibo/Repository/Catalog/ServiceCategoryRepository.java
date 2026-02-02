package com.example.thanhtoannoibo.Repository.Catalog;

import com.example.thanhtoannoibo.Common.CatalogStatus;
import com.example.thanhtoannoibo.Entity.Catalog.ServiceCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ServiceCategoryRepository extends JpaRepository<ServiceCategory, UUID>, JpaSpecificationExecutor<ServiceCategory> {

    // Tìm theo code (ví dụ: FOOD, LAUNDRY, WIFI)
    Optional<ServiceCategory> findByCategoryCode(String categoryCode);

    // Lấy danh sách đang hoạt động
    List<ServiceCategory> findAllByStatus(CatalogStatus status);
}