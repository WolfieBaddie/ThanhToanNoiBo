package com.example.thanhtoannoibo.Service.Wallet;
import com.example.thanhtoannoibo.DTO.Request.Payment.PaymentDetailCreateRequest;
import com.example.thanhtoannoibo.DTO.Response.Payment.PaymentDetailResponse;
import com.example.thanhtoannoibo.Entity.Catalog.AppService;
import com.example.thanhtoannoibo.Entity.Catalog.Counter;
import com.example.thanhtoannoibo.Entity.Wallet.PaymentDetail;
import com.example.thanhtoannoibo.Entity.Wallet.Transaction;
import com.example.thanhtoannoibo.Repository.Catalog.AppServiceRepository;
import com.example.thanhtoannoibo.Repository.Catalog.CounterRepository;
import com.example.thanhtoannoibo.Repository.Wallet.PaymentDetailRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentDetailService {
    private final PaymentDetailRepository paymentDetailRepository;
    private final AppServiceRepository serviceRepository; // Catalog repo
    private final CounterRepository counterRepository; // Catalog repo

    /**
     * Creates a payment detail record linked to a successfully completed transaction.
     * This is called when a QR Transfer is identified as a "Service Payment" (e.g. Canteen).
     */
    @Transactional
    public PaymentDetail createPaymentDetail(Transaction transaction, PaymentDetailCreateRequest request) {
        if (request == null) return null;

        // 1. Resolve optional catalog links
        AppService service = null;
        if (request.getServiceId() != null) {
            service = serviceRepository.findById(request.getServiceId())
                    .orElse(null); // Or throw exception if strict validation needed
        }

        Counter counter = null;
        if (request.getCounterId() != null) {
            counter = counterRepository.findById(request.getCounterId())
                    .orElse(null);
        }

        // 2. Build Entity
        PaymentDetail detail = PaymentDetail.builder()
                .transaction(transaction)
                .service(service)
                .counter(counter)
                .quantity(request.getQuantity() != null ? request.getQuantity() : java.math.BigDecimal.ONE)
                .amount(request.getAmount()) // Usually same as transaction.getAmount()
                .build();

        // 3. Save
        return paymentDetailRepository.save(detail);
    }

    /**
     * Convert Entity to DTO for API responses
     */
    public PaymentDetailResponse toResponse(PaymentDetail entity) {
        if (entity == null) return null;

        return PaymentDetailResponse.builder()
                .paymentDetailId(entity.getPaymentId())
                .serviceName(entity.getService() != null ? entity.getService().getServiceName() : "N/A")
                .counterName(entity.getCounter() != null ? entity.getCounter().getCounterName() : "N/A")
                .counterLocation(entity.getCounter() != null ? entity.getCounter().getLocation() : null)
                .quantity(entity.getQuantity())
                .totalAmount(entity.getAmount())
                .build();
    }
}
