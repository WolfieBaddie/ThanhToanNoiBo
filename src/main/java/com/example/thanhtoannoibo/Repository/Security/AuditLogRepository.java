package com.example.thanhtoannoibo.Repository.Security;
import com.example.thanhtoannoibo.Entity.Security.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID>{
    List<AuditLog> findByUserUserIdOrderByCreatedAtDesc(UUID userId);

    List<AuditLog> findByEntityIdOrderByCreatedAtDesc(UUID entityId);
}
