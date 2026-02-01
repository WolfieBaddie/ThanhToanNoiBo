package com.example.thanhtoannoibo.Service.Catalog;

import com.example.thanhtoannoibo.Common.CatalogStatus;
import com.example.thanhtoannoibo.Common.ErrorCode;
import com.example.thanhtoannoibo.DTO.Request.Catalog.ServiceFilterRequest;
import com.example.thanhtoannoibo.DTO.Response.Catalog.MasterServiceResponse;
import com.example.thanhtoannoibo.DTO.Response.Catalog.PackageResponse;
import com.example.thanhtoannoibo.DTO.Response.Catalog.ServiceResponse;
import com.example.thanhtoannoibo.Entity.Catalog.AppPackage;
import com.example.thanhtoannoibo.Entity.Catalog.AppService;
import com.example.thanhtoannoibo.Entity.Catalog.Counter;
import com.example.thanhtoannoibo.Entity.Catalog.MasterService;
import com.example.thanhtoannoibo.Entity.Catalog.ServiceCategory;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Exception.AppException;
import com.example.thanhtoannoibo.Repository.Catalog.*;
import com.example.thanhtoannoibo.Repository.Specfication.AppServiceSpecification;
import com.example.thanhtoannoibo.Service.Security.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private final AppServiceRepository serviceRepository;
    private final AppPackageRepository packageRepository;
    private final ServiceCategoryRepository categoryRepository;
    private final MasterServiceRepository masterServiceRepository;
    private final CounterRepository counterRepository;
    private final AuthService authService;
    private final HttpServletRequest httpRequest;

    // =========================================================================
    // PUBLIC READ METHODS (Dành cho App Mobile / Khách hàng)
    // =========================================================================

    @Transactional(readOnly = true)
    public Page<ServiceResponse> getServices(ServiceFilterRequest filter, Pageable pageable) {
        // Khách hàng xem: system=true (món chuẩn) hoặc false (món cụ thể) tùy logic app
        // Ở đây giả sử khách xem tất cả món ACTIVE
        Specification<AppService> spec = AppServiceSpecification.buildPostSpecification(
                filter,
                null, // counterId null -> xem public hoặc system tùy filter
                false // isAdmin
        );
        return serviceRepository.findAll(spec, pageable).map(this::convertToResponse);
    }

    public AppService getServiceById(UUID serviceId) {
        return serviceRepository.findById(serviceId)
                .orElseThrow(() -> new AppException(ErrorCode.SERVICE_NOT_FOUND));
    }

    public List<PackageResponse> getActivePackagesWithDetails() {
        // Logic lấy gói đang bán cho khách hàng
        List<AppPackage> packages = packageRepository.findAllWithServicesByStatus(CatalogStatus.ACTIVE);
        return packages.stream()
                .map(this::mapToPackageResponse)
                .collect(Collectors.toList());
    }

    public List<ServiceCategory> getActiveCategories() {
        return categoryRepository.findAllByStatus(CatalogStatus.ACTIVE);
    }

    // =========================================================================
    // SHARED / UTILITY METHODS
    // =========================================================================

    /**
     * Lấy danh sách Master Data (Có thể dùng cho cả Admin xem hoặc Merchant xem để đăng ký)
     */
    @Transactional(readOnly = true)
    public List<MasterServiceResponse> getAvailableMasters() {
        User currentUser = authService.getCurrentUser(httpRequest);
        Counter counter = counterRepository.findByManagedBy_UserId(currentUser.getUserId()).orElse(null);

        List<MasterService> allMasters = masterServiceRepository.findAll();
        List<String> myCodes = new ArrayList<>();

        if (counter != null) {
            myCodes = serviceRepository.findAllByCounter_CounterId(counter.getCounterId())
                    .stream().map(AppService::getServiceCode).toList();
        }
        final List<String> registeredCodes = myCodes;

        return allMasters.stream().map(m -> MasterServiceResponse.builder()
                .masterId(m.getMasterId())
                .serviceCode(m.getServiceCode())
                .serviceName(m.getServiceName())
                .fixedPrice(m.getFixedPrice())
                .imageUrl(m.getImageUrl())
                .isRegistered(registeredCodes.contains(m.getServiceCode()))
                .build()).collect(Collectors.toList());
    }

    // =========================================================================
    // MAPPERS (Giữ lại để dùng cho hàm Read)
    // =========================================================================

    private ServiceResponse convertToResponse(AppService entity) {
        String catName = entity.getCategory() != null ? entity.getCategory().getCategoryName() : "Unknown";
        return ServiceResponse.builder()
                .serviceId(entity.getServiceId())
                .serviceCode(entity.getServiceCode())
                .serviceName(entity.getServiceName())
                .unitPrice(entity.getUnitPrice())
                .categoryName(catName)
                .imageUrl(entity.getImageUrl())
                .status(entity.getStatus())
                .build();
    }

    private PackageResponse mapToPackageResponse(AppPackage entity) {
        List<PackageResponse.PackageServiceItem> items = entity.getServices().stream()
                .map(service -> PackageResponse.PackageServiceItem.builder()
                        .serviceId(service.getServiceId())
                        .serviceName(service.getServiceName())
                        .imageUrl(service.getImageUrl())
                        .originalPrice(service.getUnitPrice())
                        .build())
                .collect(Collectors.toList());

        // 2. [MỚI] Map thông tin Merchant & Counter
        PackageResponse.MerchantInfo merchantInfo = null;
        if (entity.getCounter() != null) {
            User owner = entity.getCounter().getManagedBy();
            merchantInfo = PackageResponse.MerchantInfo.builder()
                    .counterId(entity.getCounter().getCounterId())
                    .counterName(entity.getCounter().getCounterName())
                    .location(entity.getCounter().getLocation()) // Quan trọng cho User
                    .merchantId(owner != null ? owner.getUserId() : null)
                    .merchantName(owner != null ? owner.getFullName() : "Unknown Merchant")
                    .build();
        }

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
                .merchantInfo(merchantInfo) // Set info vào response
                .build();
    }
}