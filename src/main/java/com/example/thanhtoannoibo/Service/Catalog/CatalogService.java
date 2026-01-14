package com.example.thanhtoannoibo.Service.Catalog;
import com.example.thanhtoannoibo.Entity.Catalog.AppPackage;
import com.example.thanhtoannoibo.Entity.Catalog.AppService;
import com.example.thanhtoannoibo.Repository.Catalog.AppPackageRepository;
import com.example.thanhtoannoibo.Repository.Catalog.AppServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CatalogService {
    private final AppPackageRepository packageRepository;
    private final AppServiceRepository serviceRepository;

    // --- PACKAGE METHODS (Cho phụ huynh xem) ---
    public List<AppPackage> getActivePackages() {
        return packageRepository.findAllByIsActiveTrue();
    }

    public AppPackage getPackageByCode(String code) {
        return packageRepository.findByPackageCode(code)
                .orElseThrow(() -> new RuntimeException("Gói cước không tồn tại"));
    }

    // --- SERVICE METHODS (Cho máy POS/Căng tin load menu) ---
    public List<AppService> getActiveServices() {
        return serviceRepository.findAllByIsActiveTrue();
    }

    public AppService getServiceByCode(String code) {
        return serviceRepository.findByServiceCode(code)
                .orElseThrow(() -> new RuntimeException("Dịch vụ không tồn tại"));
    }
}
