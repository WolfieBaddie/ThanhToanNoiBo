package com.example.thanhtoannoibo.Repository.Catalog;

import com.example.thanhtoannoibo.Entity.Catalog.AppPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AppPackageRepository extends JpaRepository<AppPackage, UUID> {
    // Tìm gói theo mã (để API gọi cho tiện)
    Optional<AppPackage> findByPackageCode(String packageCode);

    // Lấy danh sách các gói đang hoạt động để hiển thị lên App phụ huynh
    List<AppPackage> findAllByIsActiveTrue();

    // Query nạp sẵn services để tránh lỗi Lazy Loading khi hiển thị chi tiết
    @Query("SELECT DISTINCT p FROM AppPackage p LEFT JOIN FETCH p.services WHERE p.isActive = true")
    List<AppPackage> findAllActiveWithServices();

    @Query("SELECT p FROM AppPackage p LEFT JOIN FETCH p.services WHERE p.packageId = :id")
    Optional<AppPackage> findByIdWithServices(@Param("id") UUID id);

}
