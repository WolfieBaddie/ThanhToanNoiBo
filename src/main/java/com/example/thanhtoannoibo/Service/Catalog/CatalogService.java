package com.example.thanhtoannoibo.Service.Catalog;

import com.example.thanhtoannoibo.Common.ErrorCode;
import com.example.thanhtoannoibo.DTO.Request.Catalog.CreateCategoryRequest;
import com.example.thanhtoannoibo.DTO.Request.Catalog.CreateServiceRequest;
import com.example.thanhtoannoibo.DTO.Request.Catalog.ServiceFilterRequest;
import com.example.thanhtoannoibo.DTO.Response.Catalog.ServiceResponse;
import com.example.thanhtoannoibo.Entity.Catalog.AppPackage;
import com.example.thanhtoannoibo.Entity.Catalog.AppService;
import com.example.thanhtoannoibo.Entity.Catalog.ServiceCategory;
import com.example.thanhtoannoibo.Exception.AppException;
import com.example.thanhtoannoibo.Repository.Catalog.AppPackageRepository;
import com.example.thanhtoannoibo.Repository.Catalog.AppServiceRepository;
import com.example.thanhtoannoibo.Repository.Catalog.ServiceCategoryRepository;
import lombok.RequiredArgsConstructor;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CatalogService {
    private final AppPackageRepository packageRepository;
    private final AppServiceRepository serviceRepository;
    private final ServiceCategoryRepository categoryRepository;

    // --- READ METHODS ---
    public Page<ServiceResponse> getServices(ServiceFilterRequest filter, Pageable pageable) {
        // 1. Tạo Specification (Query động)
        Specification<AppService> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Mặc định chỉ lấy Service đang Active
            predicates.add(criteriaBuilder.isTrue(root.get("isActive")));

            if (filter != null) {
                // Lọc theo từ khóa (Tên service hoặc Mã service)
                if (StringUtils.hasText(filter.getKeyword())) {
                    String likePattern = "%" + filter.getKeyword().toLowerCase().trim() + "%";

                    // Tìm trong tên OR tìm trong mã
                    Predicate nameLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("serviceName")), likePattern);
                    Predicate codeLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("serviceCode")), likePattern);

                    predicates.add(criteriaBuilder.or(nameLike, codeLike));
                }

                // Lọc theo Category ID
                if (filter.getCategoryId() != null) {
                    predicates.add(criteriaBuilder.equal(
                            root.get("category").get("categoryId"),
                            filter.getCategoryId()
                    ));
                }
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        // 2. Gọi Repository
        Page<AppService> pageResult = serviceRepository.findAll(spec, pageable);

        // 3. Convert sang DTO Response
        return pageResult.map(this::convertToResponse);
    }

    public List<AppPackage> getActivePackages() {
        return packageRepository.findAllByIsActiveTrue();
    }

    public List<ServiceCategory> getActiveCategories() {
        return categoryRepository.findAllByIsActiveTrue();
    }

    public AppService getServiceById(UUID serviceId) {
        return serviceRepository.findById(serviceId)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));
    }

    // --- WRITE METHODS (Sử dụng DTO Request) ---

    @Transactional
    public ServiceCategory createCategory(CreateCategoryRequest request) {
        // Check trùng Code
        if (categoryRepository.findByCategoryCode(request.getCategoryCode()).isPresent()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        ServiceCategory category = ServiceCategory.builder()
                .categoryCode(request.getCategoryCode().toUpperCase())
                .categoryName(request.getCategoryName())
                .description(request.getDescription())
                .iconUrl(request.getIconUrl())
                .isActive(true)
                .build();

        return categoryRepository.save(category);
    }

    @Transactional
    public AppService createService(CreateServiceRequest request) {
        // Check trùng Code
        if (serviceRepository.findByServiceCode(request.getServiceCode()).isPresent()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        // Tìm Category
        ServiceCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST));

        AppService service = AppService.builder()
                .serviceCode(request.getServiceCode().toUpperCase())
                .serviceName(request.getServiceName())
                .category(category)
                .unitPrice(request.getUnitPrice())
                .isActive(true)
                .build();

        return serviceRepository.save(service);
    }


    private ServiceResponse convertToResponse(AppService entity) {
        String catName = "Unknown";
        if (entity.getCategory() != null) {
            catName = entity.getCategory().getCategoryName();
        }

        return ServiceResponse.builder()
                .serviceId(entity.getServiceId())
                .serviceCode(entity.getServiceCode())
                .serviceName(entity.getServiceName())
                .unitPrice(entity.getUnitPrice())
                .categoryName(catName)
                .imageUrl(entity.getImageUrl())
                .build();
    }

}