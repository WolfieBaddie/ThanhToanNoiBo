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
    public static Specification<AppService> buildPostSpecification(ServiceFilterRequest filter, UUID merchantCounterId, boolean isAdmin) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. LOGIC LỌC NGUỒN DỮ LIỆU (SYSTEM vs MERCHANT)
            if (Boolean.TRUE.equals(filter.getSystem())) {
                // Nếu muốn lấy System Services -> Counter phải là NULL
                predicates.add(criteriaBuilder.isNull(root.get("counter")));
            } else {
                // Nếu muốn lấy Merchant Services -> Counter phải match với Merchant đang login
                if (merchantCounterId != null) {
                    predicates.add(criteriaBuilder.equal(
                            root.get("counter").get("counterId"),
                            merchantCounterId
                    ));
                }
            }

            // 2. LỌC THEO TRẠNG THÁI
            if (!Boolean.TRUE.equals(filter.getSystem()) || isAdmin) {
                // Nếu là của Merchant hoặc Admin xem -> Không lấy DELETED
                predicates.add(criteriaBuilder.notEqual(root.get("status"), CatalogStatus.DELETED));

                if (filter.getStatus() != null) {
                    predicates.add(criteriaBuilder.equal(root.get("status"), filter.getStatus()));
                }
            } else {
                // Nếu xem hàng Hệ thống -> Chỉ xem ACTIVE
                predicates.add(criteriaBuilder.equal(root.get("status"), CatalogStatus.ACTIVE));
            }

            // 3. KEYWORD
            if (StringUtils.hasText(filter.getKeyword())) {
                String likePattern = "%" + filter.getKeyword().toLowerCase().trim() + "%";
                Predicate nameLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("serviceName")), likePattern);
                Predicate codeLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("serviceCode")), likePattern);
                predicates.add(criteriaBuilder.or(nameLike, codeLike));
            }

            // 4. CATEGORY
            if (filter.getCategoryId() != null) {
                predicates.add(criteriaBuilder.equal(
                        root.get("category").get("categoryId"),
                        filter.getCategoryId()
                ));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<AppService> filter(ServiceFilterRequest filter) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. BẮT BUỘC: Chỉ lấy Service đang hoạt động (ACTIVE)
            predicates.add(criteriaBuilder.equal(root.get("status"), CatalogStatus.ACTIVE));

            // 2. KEYWORD (Tìm theo tên hoặc mã)
            if (StringUtils.hasText(filter.getKeyword())) {
                String likePattern = "%" + filter.getKeyword().toLowerCase().trim() + "%";
                Predicate nameLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("serviceName")), likePattern);
                Predicate codeLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("serviceCode")), likePattern);
                // Tìm kiếm cả trong tên Master Code để user tìm "Phở" ra hết các loại phở
                Predicate masterCodeLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("masterServiceCode")), likePattern);

                predicates.add(criteriaBuilder.or(nameLike, codeLike, masterCodeLike));
            }

            // 3. CATEGORY
            if (filter.getCategoryId() != null) {
                predicates.add(criteriaBuilder.equal(
                        root.get("category").get("categoryId"),
                        filter.getCategoryId()
                ));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}