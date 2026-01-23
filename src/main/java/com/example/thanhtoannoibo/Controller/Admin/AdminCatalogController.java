package com.example.thanhtoannoibo.Controller.Admin;

import com.example.thanhtoannoibo.DTO.Request.Catalog.ServiceFilterRequest;
import com.example.thanhtoannoibo.DTO.Response.BaseResponse;
import com.example.thanhtoannoibo.DTO.Response.Catalog.PackageResponse;
import com.example.thanhtoannoibo.DTO.Response.Catalog.ServiceResponse;
import com.example.thanhtoannoibo.DTO.Response.PageResponse;
import com.example.thanhtoannoibo.Service.Catalog.CatalogService;
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

    /**
     * API Lấy danh sách sản phẩm (Dùng chung cho cả Service lẻ và Package)
     * Filter:
     * - type: SERVICE (mặc định) hoặc PACKAGE
     * - categoryId: Chỉ áp dụng cho SERVICE
     * - keyword: Tìm theo tên/mã
     */
    @GetMapping
    public BaseResponse<PageResponse<?>> getCatalogItems(
            @RequestParam(defaultValue = "SERVICE") String type, // Enum: SERVICE | PACKAGE
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        // CASE 1: LẤY COMBO / GÓI (PACKAGE)
        if ("PACKAGE".equalsIgnoreCase(type)) {
            // 1. Gọi Service lấy toàn bộ list (Tận dụng method có sẵn)
            List<PackageResponse> allPackages = catalogService.getActivePackagesWithDetails();

            // 2. Filter thủ công theo Keyword (Vì Service trả về List full)
            if (StringUtils.hasText(keyword)) {
                String key = keyword.toLowerCase().trim();
                allPackages = allPackages.stream()
                        .filter(p -> p.getPackageName().toLowerCase().contains(key)
                                || p.getPackageCode().toLowerCase().contains(key))
                        .collect(Collectors.toList());
            }

            // 3. Phân trang thủ công (In-memory Pagination)
            int totalItems = allPackages.size();
            int totalPages = (int) Math.ceil((double) totalItems / size);

            // Tính toán index cắt list
            int start = Math.min(page * size, totalItems);
            int end = Math.min(start + size, totalItems);

            List<PackageResponse> pagedItems = (start > end) ? Collections.emptyList() : allPackages.subList(start, end);

            // 4. Đóng gói PageResponse
            PageResponse<PackageResponse> response = PageResponse.<PackageResponse>builder()
                    .page(page)
                    .size(size)
                    .totalItems(totalItems)
                    .totalPages(totalPages)
                    .items(pagedItems)
                    .build();

            return BaseResponse.success(response);
        }

        // CASE 2: LẤY DỊCH VỤ LẺ (SERVICE)
        else {
            // 1. Setup Filter (Tận dụng DTO của Service)
            ServiceFilterRequest filter = new ServiceFilterRequest();
            filter.setKeyword(keyword);
            filter.setCategoryId(categoryId);

            // 2. Setup Pageable
            Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
            // Lưu ý: Đảm bảo field sortBy tồn tại trong Entity AppService (ví dụ: createdAt, serviceName...)
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, "createdAt"));

            // 3. Gọi Service (Service đã hỗ trợ DB Pagination)
            Page<ServiceResponse> servicePage = catalogService.getServices(filter, pageable);

            return BaseResponse.success(PageResponse.from(servicePage));
        }
    }
}