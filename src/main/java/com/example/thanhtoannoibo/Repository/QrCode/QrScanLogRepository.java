package com.example.thanhtoannoibo.Repository.QrCode;

import com.example.thanhtoannoibo.Entity.QrCode.QrScanLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface QrScanLogRepository extends JpaRepository<QrScanLog, UUID> {
}
