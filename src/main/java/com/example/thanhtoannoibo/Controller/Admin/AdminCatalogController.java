package com.example.thanhtoannoibo.Controller.Admin;

import com.example.thanhtoannoibo.Common.CatalogStatus;
import com.example.thanhtoannoibo.DTO.Request.Catalog.*;
import com.example.thanhtoannoibo.DTO.Response.BaseResponse;
import com.example.thanhtoannoibo.DTO.Response.Catalog.AdminServiceResponse;
import com.example.thanhtoannoibo.DTO.Response.Catalog.PackageResponse;
import com.example.thanhtoannoibo.DTO.Response.Catalog.ServiceResponse;
import com.example.thanhtoannoibo.DTO.Response.PageResponse;
import com.example.thanhtoannoibo.Entity.Catalog.AppService;
import com.example.thanhtoannoibo.Entity.Catalog.MasterService;
import com.example.thanhtoannoibo.Entity.Catalog.ServiceCategory;
import com.example.thanhtoannoibo.Service.Catalog.CatalogService;
import com.example.thanhtoannoibo.Service.Catalog.Manager.AdminCategoryManager; // [BỔ SUNG]
import com.example.thanhtoannoibo.Service.Catalog.Manager.AdminPackageManager;  // [BỔ SUNG]
import com.example.thanhtoannoibo.Service.Catalog.Manager.AdminServiceManager;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/catalog")
@RequiredArgsConstructor
public class AdminCatalogController {

    private final CatalogService catalogService;
    private final AdminServiceManager adminServiceManager;

    // [BỔ SUNG] Inject thêm Manager cho Category và Package
    private final AdminCategoryManager categoryManager;
    private final AdminPackageManager packageManager;

    // =========================================================================
    // 1. VIEW CATALOG (Master View & Package View) - [GIỮ NGUYÊN]
    // =========================================================================

    @GetMapping
    public BaseResponse<PageResponse<?>> getCatalogItems(
            @RequestParam(defaultValue = "SERVICE") String type,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) CatalogStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        // ... (Logic cũ giữ nguyên 100%)
        if ("PACKAGE".equalsIgnoreCase(type)) {
            // [Phần logic cũ cho PACKAGE - Giữ nguyên]
            List<PackageResponse> allPackages = catalogService.getActivePackagesWithDetails();
            if (StringUtils.hasText(keyword)) {
                String key = keyword.toLowerCase().trim();
                allPackages = allPackages.stream()
                        .filter(p -> p.getPackageName().toLowerCase().contains(key)
                                || p.getPackageCode().toLowerCase().contains(key))
                        .collect(Collectors.toList());
            }
            int totalItems = allPackages.size();
            int totalPages = (int) Math.ceil((double) totalItems / size);
            int start = Math.min(page * size, totalItems);
            int end = Math.min(start + size, totalItems);
            List<PackageResponse> pagedItems = (start > end) ? Collections.emptyList() : allPackages.subList(start, end);

            PageResponse<PackageResponse> response = PageResponse.<PackageResponse>builder()
                    .page(page).size(size).totalItems(totalItems).totalPages(totalPages).items(pagedItems).build();
            return BaseResponse.success(response);
        } else {
            // [Phần logic cũ cho SERVICE - Giữ nguyên]
            ServiceFilterRequest filter = new ServiceFilterRequest();
            filter.setKeyword(keyword);
            filter.setCategoryId(categoryId);
            filter.setStatus(status);
            Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, "createdAt"));
            Page<AdminServiceResponse> servicePage = adminServiceManager.getAllServices(filter, pageable);
            return BaseResponse.success(PageResponse.from(servicePage));
        }
    }

    // =========================================================================
    // 2. MASTER SERVICE MANAGEMENT (CRUD) - [GIỮ NGUYÊN]
    // =========================================================================

    @PostMapping("/master")
    public BaseResponse<MasterService> createMasterService(@RequestBody @Valid CreateMasterServiceRequest request) {
        return BaseResponse.success(adminServiceManager.createMasterService(request));
    }

    @PutMapping("/master/{id}")
    public BaseResponse<MasterService> updateMasterService(
            @PathVariable("id") String serviceCode, // Nhận Service Code (VD: SVC_FREEZE_TRA)
            @RequestBody @Valid UpdateServiceRequest request) {
        return BaseResponse.success(adminServiceManager.updateMasterService(serviceCode, request));
    }

    /**
     * [ĐÃ SỬA] Nhận String id (serviceCode) thay vì UUID
     */
    @DeleteMapping("/master/{id}")
    public BaseResponse<String> deleteMasterService(@PathVariable("id") String serviceCode) {
        adminServiceManager.deleteMasterService(serviceCode);
        return BaseResponse.success("Đã xóa dịch vụ thành công");
    }

    @PatchMapping("/moderation/{serviceId}/status")
    public BaseResponse<ServiceResponse> updateMerchantServiceStatus(
            @PathVariable UUID serviceId,
            @RequestParam CatalogStatus status) {
        return BaseResponse.success(adminServiceManager.updateAppServiceStatus(serviceId, status));
    }

    // =========================================================================
    // 3. MERCHANT SERVICE MODERATION - [GIỮ NGUYÊN]
    // =========================================================================

    @GetMapping("/moderation")
    public BaseResponse<PageResponse<AppService>> getServicesForModeration(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) CatalogStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        ServiceFilterRequest filter = new ServiceFilterRequest();
        filter.setKeyword(keyword);
        filter.setCategoryId(categoryId);
        filter.setStatus(status);
        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, "createdAt"));
        Page<AppService> rawServices = adminServiceManager.getAllAppServices(filter, pageable);
        return BaseResponse.success(PageResponse.from(rawServices));
    }

    // =========================================================================
    // 4. CATEGORY MANAGEMENT - [BỔ SUNG MỚI]
    // =========================================================================

    @GetMapping("/categories")
    public BaseResponse<PageResponse<ServiceCategory>> getCategories(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) CatalogStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        ServiceFilterRequest filter = new ServiceFilterRequest();
        filter.setKeyword(keyword);
        filter.setStatus(status);

        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, "createdAt"));

        Page<ServiceCategory> categories = categoryManager.getAllCategories(filter, pageable);
        return BaseResponse.success(PageResponse.from(categories));
    }

    @PostMapping("/categories")
    public BaseResponse<ServiceCategory> createCategory(@RequestBody @Valid CreateCategoryRequest request) {
        return BaseResponse.success(categoryManager.create(request));
    }

    @PutMapping("/categories/{id}")
    public BaseResponse<ServiceCategory> updateCategory(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateCategoryRequest request) {
        return BaseResponse.success(categoryManager.update(id, request));
    }

    @DeleteMapping("/categories/{id}")
    public BaseResponse<Void> deleteCategory(@PathVariable UUID id) {
        categoryManager.delete(id);
        return BaseResponse.success(null);
    }

    // =========================================================================
    // 5. PACKAGE MANAGEMENT (Full CRUD for Admin) - [BỔ SUNG MỚI]
    // =========================================================================

    /**
     * Lấy danh sách Package đầy đủ quyền Admin (thấy cả Pending/Deleted/System/Merchant)
     * Endpoint này mạnh hơn endpoint getCatalogItems(type=PACKAGE) ở trên.
     */
    @GetMapping("/packages")
    public BaseResponse<PageResponse<PackageResponse>> getAllPackages(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) CatalogStatus status,
            @RequestParam(required = false) Boolean system,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        ServiceFilterRequest filter = new ServiceFilterRequest();
        filter.setKeyword(keyword);
        filter.setStatus(status);
        filter.setSystem(system);

        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, "createdAt"));

        Page<PackageResponse> packages = packageManager.getAllPackages(filter, pageable);
        return BaseResponse.success(PageResponse.from(packages));
    }

    @PostMapping("/packages")
    public BaseResponse<PackageResponse> createPackage(@RequestBody @Valid CreatePackageRequest request) {
        return BaseResponse.success(packageManager.create(request));
    }

    @PutMapping("/packages/{id}")
    public BaseResponse<PackageResponse> updatePackage(
            @PathVariable UUID id,
            @RequestBody @Valid UpdatePackageRequest request) {
        return BaseResponse.success(packageManager.update(id, request));
    }

    @DeleteMapping("/packages/{id}")
    public BaseResponse<Void> deletePackage(@PathVariable UUID id) {
        packageManager.delete(id);
        return BaseResponse.success(null);
    }

    /**
     * Endpoint duyệt nhanh Package (Pending -> Active)
     */
    @PatchMapping("/packages/{id}/approve")
    public BaseResponse<PackageResponse> approvePackage(@PathVariable UUID id) {
        return BaseResponse.success(packageManager.approve(id));
    }
}