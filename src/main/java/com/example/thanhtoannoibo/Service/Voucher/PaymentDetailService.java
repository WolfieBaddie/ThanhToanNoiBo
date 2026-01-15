package com.example.thanhtoannoibo.Service.Voucher;

import com.example.thanhtoannoibo.Common.ErrorCode;
import com.example.thanhtoannoibo.DTO.Request.Payment.PaymentDetailCreateRequest;
import com.example.thanhtoannoibo.DTO.Response.Payment.PaymentDetailResponse;
import com.example.thanhtoannoibo.Entity.Catalog.AppPackage;
import com.example.thanhtoannoibo.Entity.Catalog.AppService;
import com.example.thanhtoannoibo.Entity.Order.Order;
import com.example.thanhtoannoibo.Entity.Voucher.PaymentDetail;
import com.example.thanhtoannoibo.Entity.Voucher.Transaction;
import com.example.thanhtoannoibo.Exception.AppException; // Import Exception tùy chỉnh
import com.example.thanhtoannoibo.Repository.Catalog.AppPackageRepository;
import com.example.thanhtoannoibo.Repository.Catalog.AppServiceRepository;
import com.example.thanhtoannoibo.Repository.Wallet.PaymentDetailRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class PaymentDetailService {
    private final PaymentDetailRepository paymentDetailRepository;
    private final AppServiceRepository serviceRepository;
    private final AppPackageRepository packageRepository;

    /**
     * Lấy chi tiết hóa đơn theo Transaction
     */
    public PaymentDetailResponse getByTransaction(Transaction transaction) {
        if (transaction == null) {
            // Ném lỗi nếu không có transaction đầu vào
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        return paymentDetailRepository.findByTransactionTransactionId(transaction.getTransactionId())
                .map(this::toResponse)
                .orElse(null); // Hoặc ném lỗi nếu bắt buộc phải có Detail
    }

    /**
     * Tạo PaymentDetail mới
     */
    @Transactional
    public PaymentDetailResponse createPaymentDetail(Transaction transaction, PaymentDetailCreateRequest request) {
        // Kiểm tra tính hợp lệ của request và transaction
        if (transaction == null || request == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        // 1. Tìm Service (nếu có)
        AppService service = null;
        if (request.getServiceId() != null) {
            service = serviceRepository.findById(request.getServiceId())
                    .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST)); // Báo lỗi nếu ID Service sai
        }

        // 2. Tìm Package (nếu có)
        AppPackage appPackage = null;
        if (request.getPackageId() != null) {
            appPackage = packageRepository.findById(request.getPackageId())
                    .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST)); // Báo lỗi nếu ID Package sai
        }

        // 3. Build Entity
        PaymentDetail detail = PaymentDetail.builder()
                .transaction(transaction)
                .service(service)
                .packageRef(appPackage)
                .quantity(request.getQuantity() != null ? request.getQuantity() : java.math.BigDecimal.ONE)
                .amount(request.getAmount())
                .build();

        PaymentDetail savedDetail = paymentDetailRepository.save(detail);
        return toResponse(savedDetail);
    }

    /**
     * Convert Entity sang DTO Response
     */
    public PaymentDetailResponse toResponse(PaymentDetail entity) {
        if (entity == null) return null;

        Transaction txn = entity.getTransaction();

        // Logic hiển thị tên cho Top-up (khi Service/Package null)
        String itemName = "Nạp tiền vào ví";
        if (entity.getService() != null) itemName = entity.getService().getServiceName();
        else if (entity.getPackageRef() != null) itemName = entity.getPackageRef().getPackageName();

        return PaymentDetailResponse.builder()
                .paymentDetailId(entity.getPaymentId())
                .transactionId(txn != null ? txn.getTransactionId() : null)
                .transactionRef(txn != null ? txn.getTransactionRef() : null)

                .serviceId(entity.getService() != null ? entity.getService().getServiceId() : null)
                .packageId(entity.getPackageRef() != null ? entity.getPackageRef().getPackageId() : null)

                // Trả về tên hiển thị chung (Service Name hoặc Package Name hoặc "Nạp tiền")
                // Frontend có thể ưu tiên hiển thị field này
                .serviceName(itemName)
                .packageName(entity.getPackageRef() != null ? entity.getPackageRef().getPackageName() : null)

                .quantity(entity.getQuantity())
                .totalAmount(entity.getAmount())
                .build();
    }

    @Transactional
    public PaymentDetailResponse createFromOrder(Transaction transaction, Order order) {
        // Lưu ý: Không chặn null package/service nữa để hỗ trợ hiển thị hóa đơn Nạp tiền (Top-up)

        PaymentDetail detail = PaymentDetail.builder()
                .transaction(transaction)
                .packageRef(order.getPackageEntity())
                .service(order.getServiceEntity())
                .quantity(BigDecimal.ONE)
                .amount(order.getAmountPaid())
                .build();

        PaymentDetail savedDetail = paymentDetailRepository.save(detail);

        // Trả về DTO ngay lập tức
        return toResponse(savedDetail);
    }
}