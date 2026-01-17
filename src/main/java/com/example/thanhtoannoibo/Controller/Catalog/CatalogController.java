package com.example.thanhtoannoibo.Controller.Catalog;

import com.example.thanhtoannoibo.DTO.Request.Catalog.ServiceFilterRequest;
import com.example.thanhtoannoibo.DTO.Response.BaseResponse;
import com.example.thanhtoannoibo.DTO.Request.Catalog.CreateCategoryRequest;
import com.example.thanhtoannoibo.DTO.Request.Catalog.CreateServiceRequest;
import com.example.thanhtoannoibo.DTO.Response.Catalog.ServiceResponse;
import com.example.thanhtoannoibo.DTO.Response.PageResponse;
import com.example.thanhtoannoibo.Entity.Catalog.AppPackage;
import com.example.thanhtoannoibo.Entity.Catalog.AppService;
import com.example.thanhtoannoibo.Entity.Catalog.ServiceCategory;
import com.example.thanhtoannoibo.Service.Catalog.CatalogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;

    @GetMapping("/services")
    public BaseResponse<PageResponse<ServiceResponse>> getListServices(
            // Filter Params
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UUID categoryId,

            // Paging Params
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        // 1. Đóng gói Filter Request
        ServiceFilterRequest filterRequest = new ServiceFilterRequest();
        filterRequest.setKeyword(keyword);
        filterRequest.setCategoryId(categoryId);

        // 2. Tạo Pageable
        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        // 3. Gọi Service (Service trả về Page<ServiceResponse>)
        Page<ServiceResponse> pageResult = catalogService.getServices(filterRequest, pageable);

        // 4. Convert sang Custom PageResponse và trả về
        return BaseResponse.success(PageResponse.from(pageResult));
    }

    @GetMapping("/categories")
    public ResponseEntity<BaseResponse<List<ServiceCategory>>> getCategories() {
        List<ServiceCategory> categories = catalogService.getActiveCategories();
        return ResponseEntity.ok(BaseResponse.success(categories));
    }

    @GetMapping("/services/{id}")
    public BaseResponse<ServiceResponse> getServiceDetail(@PathVariable UUID id) {
        AppService service = catalogService.getServiceById(id);
        return BaseResponse.success(mapToResponse(service));
    }

    @PostMapping
    public BaseResponse<ServiceResponse> createService(@RequestBody @Valid CreateServiceRequest request) {
        AppService createdService = catalogService.createService(request);
        return BaseResponse.success(mapToResponse(createdService), "Tạo dịch vụ thành công");
    }

    @GetMapping("/packages")
    public ResponseEntity<BaseResponse<List<AppPackage>>> getAllPackages() {
        return ResponseEntity.ok(BaseResponse.success(catalogService.getActivePackages()));
    }

    // --- ADMIN CREATE API ---

    @PostMapping("/categories")
    public ResponseEntity<BaseResponse<ServiceCategory>> createCategory(
            @Valid @RequestBody CreateCategoryRequest request,
            HttpServletRequest httpRequest
    ) {
        // Tự động set metadata từ BaseRequest (nếu cần dùng cho AuditLog sau này)
        request.setClientIp(httpRequest.getRemoteAddr());

        ServiceCategory category = catalogService.createCategory(request);
        return ResponseEntity.ok(BaseResponse.success(category, "Tạo danh mục thành công"));
    }

    @PostMapping("/services")
    public ResponseEntity<BaseResponse<AppService>> createService(
            @Valid @RequestBody CreateServiceRequest request,
            HttpServletRequest httpRequest
    ) {
        request.setClientIp(httpRequest.getRemoteAddr());

        AppService service = catalogService.createService(request);
        return ResponseEntity.ok(BaseResponse.success(service, "Tạo dịch vụ thành công"));
    }

    private ServiceResponse mapToResponse(AppService entity) {
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