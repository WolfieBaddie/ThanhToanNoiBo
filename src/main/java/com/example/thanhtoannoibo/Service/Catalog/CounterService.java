package com.example.thanhtoannoibo.Service.Catalog;
import com.example.thanhtoannoibo.Common.CounterStatus;
import com.example.thanhtoannoibo.Entity.Catalog.Counter;
import com.example.thanhtoannoibo.Repository.Catalog.CounterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CounterService {
    private final CounterRepository counterRepository;

    /**
     * Called by IoT devices to report they are online.
     */
//    @Transactional
//    public void processHeartbeat(String deviceIdentifier, String ipAddress) {
//        counterRepository.findByDeviceIdentifier(deviceIdentifier)
//                .ifPresentOrElse(counter -> {
//                    counter.setLastHeartbeat(LocalDateTime.now());
//                    counter.setDeviceIp(ipAddress);
//
//                    // Auto-recover status if it was offline
//                    if (counter.getStatus() == CounterStatus.OFFLINE) {
//                        counter.setStatus(CounterStatus.ACTIVE);
//                    }
//                    counterRepository.save(counter);
//                }, () -> {
//                    // Optional: Auto-register unknown devices or log warning
//                    // log.warn("Unknown device heartbeat: " + deviceIdentifier);
//                });
//    }
//
//    public Counter getCounterByCode(String code) {
//        return counterRepository.findByCounterCode(code)
//                .orElseThrow(() -> new RuntimeException("Counter not found: " + code));
//    }
}
