package com.example.thanhtoannoibo.Repository.Catalog;

import com.example.thanhtoannoibo.Entity.Catalog.AppPackage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AppPackageRepository extends JpaRepository<AppPackage, UUID> {
    // Tìm gói theo mã (để API gọi cho tiện)
    Optional<AppPackage> findByPackageCode(String packageCode);

    // Lấy danh sách các gói đang hoạt động để hiển thị lên App phụ huynh
    List<AppPackage> findAllByIsActiveTrue();

}
