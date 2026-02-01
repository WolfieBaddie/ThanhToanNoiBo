package com.example.thanhtoannoibo.Service.Catalog;

import com.example.thanhtoannoibo.Common.ErrorCode;
import com.example.thanhtoannoibo.Common.UserType;
import com.example.thanhtoannoibo.DTO.Request.Catalog.ServiceFilterRequest;
import com.example.thanhtoannoibo.DTO.Response.Catalog.PackageResponse;
import com.example.thanhtoannoibo.DTO.Response.Catalog.ServiceResponse;
import com.example.thanhtoannoibo.Entity.Catalog.AppPackage;
import com.example.thanhtoannoibo.Entity.Catalog.AppService;
import com.example.thanhtoannoibo.Entity.Catalog.Counter;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Exception.AppException;
import com.example.thanhtoannoibo.Repository.Catalog.AppPackageRepository;
import com.example.thanhtoannoibo.Repository.Catalog.AppServiceRepository;
import com.example.thanhtoannoibo.Repository.Catalog.CounterRepository;

import com.example.thanhtoannoibo.Repository.Specfication.AppPackageSpecification;
import com.example.thanhtoannoibo.Repository.Specfication.AppServiceSpecification;
import com.example.thanhtoannoibo.Service.Security.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MerchantCatalogService {

    private final AppServiceRepository serviceRepository;
    private final AppPackageRepository packageRepository;
    private final CounterRepository counterRepository; // [Inject]
    private final AuthService authService;
    private final HttpServletRequest httpRequest;

    /**
     * Lấy danh sách Service của Counter thuộc Merchant
     */
    @Transactional(readOnly = true)
    public Page<ServiceResponse> getMyServices(ServiceFilterRequest filter, Pageable pageable) {
        User currentUser = authService.getCurrentUser(httpRequest);
        if (currentUser.getUserType() != UserType.MERCHANT) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Counter counter = counterRepository.findByManagedBy_UserId(currentUser.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.MERCHANT_NO_COUNTER));

        // Logic phân loại System vs My Counter
        UUID targetCounterId = Boolean.TRUE.equals(filter.getSystem()) ? null : counter.getCounterId();

        Specification<AppService> spec = AppServiceSpecification.buildPostSpecification(
                filter,
                targetCounterId, // Truyền null nếu lấy System, truyền ID nếu lấy của tôi
                false
        );

        Page<AppService> pageResult = serviceRepository.findAll(spec, pageable);
        return pageResult.map(this::convertToServiceResponse);
    }

    /**
     * Lấy danh sách Packages của Counter thuộc Merchant
     */
    @Transactional(readOnly = true)
    public Page<PackageResponse> getMyPackages(ServiceFilterRequest filter, Pageable pageable) {
        User currentUser = authService.getCurrentUser(httpRequest);
        if (currentUser.getUserType() != UserType.MERCHANT) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Counter counter = counterRepository.findByManagedBy_UserId(currentUser.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.MERCHANT_NO_COUNTER));

        // [QUAN TRỌNG] Logic quyết định lọc theo ai?
        // Nếu filter.system = true -> Lấy gói hệ thống (targetCounterId = null)
        // Nếu filter.system = false -> Lấy gói của quầy này (targetCounterId = counterId)
        UUID targetCounterId = Boolean.TRUE.equals(filter.getSystem()) ? null : counter.getCounterId();

        // Sử dụng Specification thay vì Query cứng
        Specification<AppPackage> spec = AppPackageSpecification.buildSpecification(
                filter,
                targetCounterId
        );

        // Gọi hàm findAll của JpaSpecificationExecutor
        Page<AppPackage> pageResult = packageRepository.findAll(spec, pageable);

        return pageResult.map(this::convertToPackageResponse);
    }

    // --- Mappers ---

    private ServiceResponse convertToServiceResponse(AppService entity) {
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
                .status(entity.getStatus())
                .masterServiceCode(entity.getMasterServiceCode())
                .build();
    }

    private PackageResponse convertToPackageResponse(AppPackage entity) {
        List<PackageResponse.PackageServiceItem> items = entity.getServices().stream()
                .map(service -> PackageResponse.PackageServiceItem.builder()
                        .serviceId(service.getServiceId())
                        .serviceName(service.getServiceName())
                        .imageUrl(service.getImageUrl())
                        .originalPrice(service.getUnitPrice())
                        .build())
                .collect(Collectors.toList());

        return PackageResponse.builder()
                .packageId(entity.getPackageId())
                .packageCode(entity.getPackageCode())
                .packageName(entity.getPackageName())
                .description(entity.getDescription())
                .price(entity.getPrice())
                .packageType(entity.getPackageType())
                .creditValue(entity.getCreditValue())
                .status(entity.getStatus())
                .items(items)
                .build();
    }
}