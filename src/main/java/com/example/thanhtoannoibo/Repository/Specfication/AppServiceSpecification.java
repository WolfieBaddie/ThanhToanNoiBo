package com.example.thanhtoannoibo.Repository.Specfication;

import com.example.thanhtoannoibo.Common.CatalogStatus;
import com.example.thanhtoannoibo.DTO.Request.Catalog.ServiceFilterRequest;
import com.example.thanhtoannoibo.Entity.Catalog.AppService;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class AppServiceSpecification {

    /**
     * LOGIC CHÍNH (Core Logic)
     */
    public static Specification<AppService> filter(ServiceFilterRequest filter, UUID merchantCounterId) {
        return (root, query, criteriaBuilder) -> {
            query.distinct(true);
            List<Predicate> predicates = new ArrayList<>();

            // 1. LOC THEO NGUỒN (SYSTEM / MERCHANT)
            if (Boolean.TRUE.equals(filter.getSystem())) {
                // System Service: counter IS NULL
                predicates.add(criteriaBuilder.isNull(root.get("counter")));
            } else {
                // Merchant Service: counter_id == merchantCounterId
                if (merchantCounterId != null) {
                    predicates.add(criteriaBuilder.equal(
                            root.get("counter").get("counterId"), 
                            merchantCounterId
                    ));
                }
            }

            // 2. TRẠNG THÁI (Mặc định ẩn DELETED)
            predicates.add(criteriaBuilder.notEqual(root.get("status"), CatalogStatus.DELETED));
            if (filter.getStatus() != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), filter.getStatus()));
            }

            // 3. KEYWORD
            if (StringUtils.hasText(filter.getKeyword())) {
                String likePattern = "%" + filter.getKeyword().toLowerCase().trim() + "%";
                Predicate nameLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("serviceName")), likePattern);
                Predicate codeLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("serviceCode")), likePattern);
                predicates.add(criteriaBuilder.or(nameLike, codeLike));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * [FIX LỖI 1] Overload cho CatalogService (Chỉ truyền request, không có merchantId)
     * Thường dùng cho Admin hoặc Guest xem catalog chung
     */
    public static Specification<AppService> filter(ServiceFilterRequest filter) {
        // Truyền merchantCounterId = null
        return filter(filter, null);
    }

    /**
     * [FIX LỖI 2] Overload cho MerchantCatalogService (Tên hàm cũ là buildPostSpecification)
     * Map sang logic filter mới
     */
    public static Specification<AppService> buildPostSpecification(ServiceFilterRequest filter, UUID merchantCounterId, boolean isSystem) {
        // Cập nhật flag system vào filter request để tái sử dụng logic chính
        filter.setSystem(isSystem);
        return filter(filter, merchantCounterId);
    }
}