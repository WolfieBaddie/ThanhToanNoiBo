package com.example.thanhtoannoibo.Controller.Catalog;

import com.example.thanhtoannoibo.DTO.Request.Catalog.ServiceFilterRequest;
import com.example.thanhtoannoibo.DTO.Response.BaseResponse;
import com.example.thanhtoannoibo.DTO.Response.Catalog.CatalogDataResponse;
import com.example.thanhtoannoibo.DTO.Response.Catalog.PackageResponse;
import com.example.thanhtoannoibo.DTO.Response.Catalog.ServiceResponse;
import com.example.thanhtoannoibo.DTO.Response.PageResponse;
import com.example.thanhtoannoibo.Entity.Catalog.AppService;
import com.example.thanhtoannoibo.Entity.Catalog.ServiceCategory;
import com.example.thanhtoannoibo.Service.Catalog.CatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
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

    @GetMapping("/packages")
    public ResponseEntity<BaseResponse<List<PackageResponse>>> getAllPackages() {
        List<PackageResponse> result = catalogService.getActivePackagesWithDetails();

        return ResponseEntity.ok(BaseResponse.success(result));
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


    @GetMapping("/everything") // Hoặc /home-data
    public ResponseEntity<BaseResponse<CatalogDataResponse>> getCatalogData(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        // 1. Gọi lấy Packages (Thường số lượng ít, lấy hết hoặc lấy top active)
        List<PackageResponse> packages = catalogService.getActivePackagesWithDetails();

        // 2. Gọi lấy Services (Có phân trang & filter keyword)
        ServiceFilterRequest filter = new ServiceFilterRequest();
        filter.setKeyword(keyword);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ServiceResponse> servicesPage = catalogService.getServices(filter, pageable);

        // 3. Gom lại
        CatalogDataResponse data = CatalogDataResponse.builder()
                .packages(packages)
                .services(PageResponse.from(servicesPage))
                .build();

        return ResponseEntity.ok(BaseResponse.success(data));
    }
}