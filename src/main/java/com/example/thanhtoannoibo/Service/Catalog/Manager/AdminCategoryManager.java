package com.example.thanhtoannoibo.Service.Catalog.Manager;

import com.example.thanhtoannoibo.Common.CatalogStatus;
import com.example.thanhtoannoibo.Common.ErrorCode;
import com.example.thanhtoannoibo.Common.UserType;
import com.example.thanhtoannoibo.DTO.Request.Catalog.CreateCategoryRequest;
import com.example.thanhtoannoibo.DTO.Request.Catalog.ServiceFilterRequest;
import com.example.thanhtoannoibo.DTO.Request.Catalog.UpdateCategoryRequest;
import com.example.thanhtoannoibo.Entity.Catalog.ServiceCategory;
import com.example.thanhtoannoibo.Entity.Security.AuditLog; // [MỚI]
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Exception.AppException;
import com.example.thanhtoannoibo.Repository.Catalog.ServiceCategoryRepository;
import com.example.thanhtoannoibo.Repository.Security.AuditLogRepository; // [MỚI]
import com.example.thanhtoannoibo.Service.Notification.NotificationService;
import com.example.thanhtoannoibo.Service.Security.AuthService;
import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminCategoryManager {

    private final ServiceCategoryRepository categoryRepository;
    private final AuthService authService;
    private final HttpServletRequest httpRequest;
    private final NotificationService notificationService;
    private final AuditLogRepository auditLogRepository; // [MỚI] Inject Repo

    // =========================================================================
    // 1. READ (Lấy danh sách Danh mục - Admin xem Full)
    // =========================================================================
    @Transactional(readOnly = true)
    public Page<ServiceCategory> getAllCategories(ServiceFilterRequest filter, Pageable pageable) {
        validateAdmin();

        Specification<ServiceCategory> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(filter.getKeyword())) {
                String pattern = "%" + filter.getKeyword().trim().toLowerCase() + "%";
                Predicate codeLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("categoryCode")), pattern);
                Predicate nameLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("categoryName")), pattern);
                predicates.add(criteriaBuilder.or(codeLike, nameLike));
            }

            if (filter.getStatus() != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), filter.getStatus()));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return categoryRepository.findAll(spec, pageable);
    }

    // =========================================================================
    // 2. CREATE (Tạo danh mục mới)
    // =========================================================================
    @Transactional
    public ServiceCategory create(CreateCategoryRequest request) {
        User admin = validateAdmin();

        if (categoryRepository.findByCategoryCode(request.getCategoryCode()).isPresent()) {
            throw new AppException(ErrorCode.CATEGORY_CODE_EXISTS);
        }

        ServiceCategory category = ServiceCategory.builder()
                .categoryCode(request.getCategoryCode().toUpperCase())
                .categoryName(request.getCategoryName())
                .description(request.getDescription())
                .iconUrl(request.getIconUrl())
                .status(CatalogStatus.ACTIVE)
                .build();

        ServiceCategory saved = categoryRepository.save(category);

        // [AUDIT LOG]
        saveAuditLog(admin, "CREATE_CATEGORY", saved.getCategoryId(),
                "Tạo danh mục mới: " + saved.getCategoryName() + " (" + saved.getCategoryCode() + ")");

        // Notify Admin
        notifyAdmin(admin, "Tạo danh mục thành công",
                "Danh mục '" + saved.getCategoryName() + "' đã được thêm vào hệ thống.");

        return saved;
    }

    // =========================================================================
    // 3. UPDATE (Cập nhật thông tin danh mục)
    // =========================================================================
    @Transactional
    public ServiceCategory update(UUID categoryId, UpdateCategoryRequest request) {
        User admin = validateAdmin();

        ServiceCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        if (category.getStatus() == CatalogStatus.DELETED) {
            if (request.getStatus() == null || request.getStatus() == CatalogStatus.DELETED) {
                throw new AppException(ErrorCode.CATEGORY_INACTIVE);
            }
        }

        StringBuilder changeDetails = new StringBuilder(); // Theo dõi thay đổi
        boolean isUpdated = false;

        // 1. Update Status
        if (request.getStatus() != null && request.getStatus() != category.getStatus()) {
            changeDetails.append(String.format("Trạng thái: %s -> %s. ", category.getStatus(), request.getStatus()));
            category.setStatus(request.getStatus());
            isUpdated = true;
        }

        // 2. Update Info
        if (StringUtils.hasText(request.getCategoryName()) && !request.getCategoryName().equals(category.getCategoryName())) {
            changeDetails.append(String.format("Tên: '%s' -> '%s'. ", category.getCategoryName(), request.getCategoryName()));
            category.setCategoryName(request.getCategoryName());
            isUpdated = true;
        }
        if (StringUtils.hasText(request.getDescription()) && !request.getDescription().equals(category.getDescription())) {
            // Chỉ ghi log là có thay đổi mô tả, không cần ghi chi tiết nội dung dài
            changeDetails.append("Cập nhật mô tả. ");
            category.setDescription(request.getDescription());
            isUpdated = true;
        }
        if (StringUtils.hasText(request.getIconUrl()) && !request.getIconUrl().equals(category.getIconUrl())) {
            changeDetails.append("Cập nhật Icon. ");
            category.setIconUrl(request.getIconUrl());
            isUpdated = true;
        }

        if (isUpdated) {
            ServiceCategory saved = categoryRepository.save(category);

            // [AUDIT LOG]
            saveAuditLog(admin, "UPDATE_CATEGORY", saved.getCategoryId(), changeDetails.toString());

            notifyAdmin(admin, "Cập nhật danh mục",
                    "Đã cập nhật thông tin danh mục '" + saved.getCategoryName() + "'.");
            return saved;
        }
        return category;
    }

    // =========================================================================
    // 4. DELETE (Xóa mềm danh mục)
    // =========================================================================
    @Transactional
    public void delete(UUID categoryId) {
        User admin = validateAdmin();

        ServiceCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        if (category.getStatus() != CatalogStatus.DELETED) {
            category.setStatus(CatalogStatus.DELETED);
            categoryRepository.save(category);

            // [AUDIT LOG]
            saveAuditLog(admin, "DELETE_CATEGORY", category.getCategoryId(),
                    "Xóa mềm danh mục (Chuyển trạng thái sang DELETED)");

            notifyAdmin(admin, "Xóa danh mục",
                    "Đã xóa danh mục '" + category.getCategoryName() + "'.");
        }
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    /**
     * Helper ghi Audit Log chung
     */
    private void saveAuditLog(User actor, String action, UUID entityId, String description) {
        try {
            Map<String, Object> details = new HashMap<>();
            details.put("description", description);
            details.put("timestamp", System.currentTimeMillis());

            AuditLog log = AuditLog.builder()
                    .user(actor)
                    .action(action)
                    .entityType("CATEGORY") // Loại đối tượng
                    .entityId(entityId)
                    .details(details)
                    .ipAddress(getClientIp())
                    .createdAt(LocalDateTime.now())
                    .build();

            auditLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("Lỗi lưu AuditLog Category: " + e.getMessage());
        }
    }

    private String getClientIp() {
        String remoteAddr = "";
        if (httpRequest != null) {
            remoteAddr = httpRequest.getHeader("X-FORWARDED-FOR");
            if (!StringUtils.hasText(remoteAddr)) {
                remoteAddr = httpRequest.getRemoteAddr();
            }
        }
        return remoteAddr;
    }

    private User validateAdmin() {
        User u = authService.getCurrentUser(httpRequest);
        if (u.getUserType() != UserType.ADMIN) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        return u;
    }

    private void notifyAdmin(User admin, String title, String message) {
        try {
            notificationService.createNotification(admin, title, message, "SUCCESS", "/admin/categories");
        } catch (Exception ignored) {}
    }
}