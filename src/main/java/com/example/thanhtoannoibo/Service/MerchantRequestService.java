package com.example.thanhtoannoibo.Service;

import com.example.thanhtoannoibo.DTO.Request.MerchantSubmitRequest;
import com.example.thanhtoannoibo.DTO.Response.MerchantReconciliationDTO;
import com.example.thanhtoannoibo.DTO.Response.MerchantRequestResponse;
import com.example.thanhtoannoibo.Entity.Merchant.MerchantRequest;
import com.example.thanhtoannoibo.Entity.Notification;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Repository.Merchant.MerchantRequestRepository;
import com.example.thanhtoannoibo.Repository.Notification.NotificationRepository; // Repo Notification
import com.example.thanhtoannoibo.Repository.Security.UserRepository;
import com.example.thanhtoannoibo.Repository.Wallet.TransactionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class MerchantRequestService {

    private final MerchantRequestRepository requestRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository; // Thêm Repo này
    private final ObjectMapper objectMapper;

    /**
     * 1. Merchant tự cập nhật thông tin (Tên & QR)
     * - Lưu lịch sử vào bảng merchant_requests (để trace lại sau này)
     * - Update thẳng vào bảng User
     * - Tạo Notification thông báo
     */
    @Transactional
    public void submitUpdateInfoRequest(User merchant, MerchantSubmitRequest dto) throws Exception {
        // A. Lưu lịch sử request (Log lại việc thay đổi)
        MerchantRequest request = MerchantRequest.builder()
                .merchantId(merchant.getUserId())
                .requestType("UPDATE_INFO")
                .requestData(objectMapper.writeValueAsString(dto))
                .status("PENDING") // Tự động Approved vì update luôn
                .reviewedAt(LocalDateTime.now()) // Thời gian duyệt là ngay lập tức
                .build();
        requestRepository.save(request);

        // B. Cập nhật trực tiếp vào Profile Merchant
        boolean isUpdated = false;
        if (dto.getFullName() != null && !dto.getFullName().trim().isEmpty()) {
            merchant.setFullName(dto.getFullName());
            isUpdated = true;
        }
        if (dto.getQrPaymentUrl() != null && !dto.getQrPaymentUrl().trim().isEmpty()) {
            merchant.setQrPaymentUrl(dto.getQrPaymentUrl());
            isUpdated = true;
        }

        if (isUpdated) {
            userRepository.save(merchant);
            log.info("Merchant {} updated their profile directly.", merchant.getUserId());

            // C. Tạo Notification cho Merchant
            createNotification(
                    merchant,
                    "Gửi yêu cầu thành công.",
                    "Gửi yêu cầu đối soát và kết toán hàng tháng thành công, hãy đợi admin duyệt."
            );
        }
    }

    /**
     * 2. Lấy lịch sử các lần cập nhật của Merchant
     */
    public List<MerchantRequestResponse> getMyRequestHistory(UUID merchantId) {
        List<MerchantRequest> requests = requestRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId);
        return requests.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * 3. Lấy dữ liệu đối soát
     */
    public List<MerchantReconciliationDTO> getReconciliationData(UUID merchantId) {
        return transactionRepository.getMerchantReconciliation(merchantId);
    }

    /**
     * 4. Xuất file Excel đối soát
     */
    public byte[] exportReconciliationExcel(UUID merchantId) throws Exception {
        List<MerchantReconciliationDTO> data = getReconciliationData(merchantId);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Doi Soat Giao Dich");

            // ... (Code tạo Excel giữ nguyên như cũ) ...

            // Header Style
            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            String[] columns = {"Mã giao dịch", "Thời gian", "Số tiền", "Trạng thái", "Nội dung", "Người thanh toán", "Voucher", "Món ăn/Dịch vụ"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (MerchantReconciliationDTO dto : data) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(dto.getMaGiaoDich());
                row.createCell(1).setCellValue(dto.getThoiGian().toString());
                row.createCell(2).setCellValue(dto.getSoTien().doubleValue());
                row.createCell(3).setCellValue(dto.getTrangThai());
                row.createCell(4).setCellValue(dto.getNoiDung());
                row.createCell(5).setCellValue(dto.getNguoiThanhToan());
                row.createCell(6).setCellValue(dto.getMaVoucher() != null ? dto.getMaVoucher() : "");
                row.createCell(7).setCellValue(dto.getTenDichVuVoucher() != null ? dto.getTenDichVuVoucher() : "");
            }

            for (int i = 0; i < columns.length; i++) sheet.autoSizeColumn(i);

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public MerchantRequestResponse getDetailRequest(UUID requestId, UUID merchantId) {
        MerchantRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu"));

        // Bảo mật: Kiểm tra xem request này có phải của merchant đang login không
        if (!request.getMerchantId().equals(merchantId)) {
            throw new RuntimeException("Bạn không có quyền xem yêu cầu này");
        }

        return mapToResponse(request);
    }

    // --- Helpers ---

    private void createNotification(User user, String title, String message) {
        try {
            Notification notification = Notification.builder()
                    .user(user)
                    .title(title)
                    .message(message)
                    .isRead(false)
                    .type("SYSTEM") // Hoặc MERCHANT_UPDATE
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notification);
        } catch (Exception e) {
            log.error("Failed to create notification", e);
        }
    }

    private MerchantRequestResponse mapToResponse(MerchantRequest entity) {
        MerchantSubmitRequest submittedData = null;
        try {
            submittedData = objectMapper.readValue(entity.getRequestData(), MerchantSubmitRequest.class);
        } catch (Exception e) {
            log.error("Failed to parse request data", e);
        }

        return MerchantRequestResponse.builder()
                .requestId(entity.getRequestId())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                // Chỉ lấy những gì merchant cần xem
                .submittedFullName(submittedData != null ? submittedData.getFullName() : null)
                .submittedQrUrl(submittedData != null ? submittedData.getQrPaymentUrl() : null)
                .build();
    }
}