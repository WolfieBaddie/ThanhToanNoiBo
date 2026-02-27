package com.example.thanhtoannoibo.Repository.Catalog;

import com.example.thanhtoannoibo.Common.CatalogStatus;
import com.example.thanhtoannoibo.Entity.Catalog.AppPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor; // [THÊM]
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

// [SỬA] Thêm JpaSpecificationExecutor để hỗ trợ query động
public interface AppPackageRepository extends JpaRepository<AppPackage, UUID>, JpaSpecificationExecutor<AppPackage> {

    Optional<AppPackage> findByPackageCode(String packageCode);

    List<AppPackage> findByServices_Counter_CounterId(UUID counterId);

    @Query("SELECT DISTINCT p FROM AppPackage p LEFT JOIN FETCH p.services WHERE p.status = 'ACTIVE'")
    List<AppPackage> findAllActiveWithServices();

    boolean existsByPackageCode(String packageCode);

    @Query("SELECT DISTINCT p FROM AppPackage p " +
            "LEFT JOIN FETCH p.services " +
            "LEFT JOIN FETCH p.counter c " +
            "LEFT JOIN FETCH c.managedBy u " +
            "WHERE p.status = :status")
    List<AppPackage> findAllWithServicesByStatus(@Param("status") CatalogStatus status);

    // [CẬP NHẬT] Join thêm Counter và User cho query chi tiết
    @Query("SELECT p FROM AppPackage p " +
            "LEFT JOIN FETCH p.services " +
            "LEFT JOIN FETCH p.counter c " +
            "LEFT JOIN FETCH c.managedBy u " +
            "WHERE p.packageId = :id")
    Optional<AppPackage> findByIdWithServices(@Param("id") UUID id);

    long countByCounter_CounterId(UUID counterId);

    List<AppPackage> findByCounter_CounterId(UUID counterId);

}