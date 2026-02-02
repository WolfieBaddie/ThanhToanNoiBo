package com.example.thanhtoannoibo.Repository.Catalog;

import com.example.thanhtoannoibo.Entity.Catalog.MasterService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MasterServiceRepository extends JpaRepository<MasterService, UUID>, JpaSpecificationExecutor<MasterService> {

    Optional<MasterService> findByServiceCode(String serviceCode);

    boolean existsByServiceCode(String serviceCode);

    List<MasterService> findByCategory_CategoryId(UUID categoryId);
}