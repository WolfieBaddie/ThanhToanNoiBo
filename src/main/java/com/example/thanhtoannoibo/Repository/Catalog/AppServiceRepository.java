package com.example.thanhtoannoibo.Repository.Catalog;
import com.example.thanhtoannoibo.Common.CatalogStatus;
import com.example.thanhtoannoibo.Entity.Catalog.AppService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppServiceRepository extends JpaRepository<AppService, UUID>, JpaSpecificationExecutor<AppService> {

    @Query("SELECT a.serviceCode FROM AppService a " +
            "LEFT JOIN a.counter c " +
            "LEFT JOIN c.managedBy u " +
            "WHERE (:searchKey IS NULL OR " +
            "       lower(a.serviceName) LIKE :searchKey OR " +
            "       lower(cast(a.serviceCode as string)) LIKE :searchKey OR " +
            "       lower(c.counterName) LIKE :searchKey) " +
            "AND (:categoryId IS NULL OR a.category.categoryId = :categoryId) " +
            "AND (CAST(:status AS string) IS NULL OR a.status = :status) " +
            "GROUP BY a.serviceCode " +
            "ORDER BY MAX(a.createdAt) DESC")
    Page<String> findDistinctServiceCodes(
            @Param("searchKey") String searchKey,
            @Param("categoryId") UUID categoryId,
            @Param("status") CatalogStatus status,
            Pageable pageable
    );

    // [QUERY PHỤ] Lấy chi tiết các merchant bán món này (Eager load để tránh N+1)
    @Query("SELECT a FROM AppService a " +
            "LEFT JOIN FETCH a.counter c " +
            "LEFT JOIN FETCH c.managedBy u " +
            "LEFT JOIN FETCH a.category cat " +
            "WHERE a.serviceCode = :serviceCode")
    List<AppService> findAllByServiceCode(@Param("serviceCode") String serviceCode);

    Optional<AppService> findByServiceCode(String serviceCode);

    // [MỚI] Kiểm tra trùng mã trong phạm vi 1 quầy
    boolean existsByServiceCodeAndCounter_CounterId(String serviceCode, UUID counterId);

    // [MỚI] Tìm tất cả service của 1 quầy (Dùng cho API lấy danh sách Master để lọc ra món đã có)
    List<AppService> findAllByCounter_CounterId(UUID counterId);

    // [MỚI] Tìm service cụ thể của 1 quầy (Dùng cho việc quét QR/Redemption sau này)
    Optional<AppService> findByServiceCodeAndCounter_CounterId(String serviceCode, UUID counterId);

    List<AppService> findAllByStatus(CatalogStatus status);

    List<AppService> findByCategory_CategoryCodeAndStatus(String categoryCode, CatalogStatus status);

    List<AppService> findByCategory_CategoryId(UUID categoryId);

    List<AppService> findAllByMasterServiceCode(String masterServiceCode);

    // [MỚI] Tìm thằng AppService hệ thống (Con đầu tiên, chưa gắn counter)
    Optional<AppService> findByMasterServiceCodeAndCounterIsNull(String masterServiceCode);
}