package com.example.thanhtoannoibo.Repository.Specfication;

import com.example.thanhtoannoibo.Common.CatalogStatus;
import com.example.thanhtoannoibo.DTO.Request.Catalog.ServiceFilterRequest;
import com.example.thanhtoannoibo.Entity.Catalog.AppPackage;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class AppPackageSpecification {

    public static Specification<AppPackage> buildSpecification(ServiceFilterRequest filter, UUID merchantCounterId) {
        return (root, query, criteriaBuilder) -> {
            // DISTINCT để đảm bảo an toàn nếu sau này có join
            query.distinct(true);

            List<Predicate> predicates = new ArrayList<>();

            // =========================================================================
            // [ĐÃ SỬA] CHECK QUYỀN SỞ HỮU TRỰC TIẾP TRÊN PACKAGE (root)
            // Thay vì join sang services để check.
            // =========================================================================

            // 1. LOGIC LỌC NGUỒN (SYSTEM vs MERCHANT)
            if (Boolean.TRUE.equals(filter.getSystem())) {
                // Gói hệ thống: counter_id IS NULL (Không thuộc về quầy nào)
                predicates.add(criteriaBuilder.isNull(root.get("counter")));
            } else {
                // Gói của tôi: counter_id == merchantCounterId
                if (merchantCounterId != null) {
                    predicates.add(criteriaBuilder.equal(
                            root.get("counter").get("counterId"), // Check trực tiếp trên Package
                            merchantCounterId
                    ));
                }
            }

            // 2. TRẠNG THÁI (Không lấy Deleted)
            predicates.add(criteriaBuilder.notEqual(root.get("status"), CatalogStatus.DELETED));
            if (filter.getStatus() != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), filter.getStatus()));
            }

            // 3. KEYWORD (Tên gói hoặc Mã gói)
            if (StringUtils.hasText(filter.getKeyword())) {
                String likePattern = "%" + filter.getKeyword().toLowerCase().trim() + "%";
                Predicate nameLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("packageName")), likePattern);
                Predicate codeLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("packageCode")), likePattern);
                predicates.add(criteriaBuilder.or(nameLike, codeLike));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}