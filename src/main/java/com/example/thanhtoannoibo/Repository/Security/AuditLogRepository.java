package com.example.thanhtoannoibo.Repository.Security;
import com.example.thanhtoannoibo.Entity.Security.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID>{
    // Find logs for a specific user
    List<AuditLogRepository> findByUserUserIdOrderByCreatedAtDesc(UUID userId);

    // Find logs related to a specific entity (e.g., a specific transaction ID)
    List<AuditLogRepository> findByEntityIdOrderByCreatedAtDesc(UUID entityId);
}
