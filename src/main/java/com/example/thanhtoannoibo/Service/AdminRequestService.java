package com.example.thanhtoannoibo.Service;

import com.example.thanhtoannoibo.DTO.Request.Admin.AdminReviewRequest;
import com.example.thanhtoannoibo.DTO.Request.MerchantSubmitRequest;

import com.example.thanhtoannoibo.DTO.Response.Admin.AdminMerchantRequestDetailResponse;
import com.example.thanhtoannoibo.DTO.Response.MerchantReconciliationDTO;
import com.example.thanhtoannoibo.Entity.Merchant.MerchantRequest;
import com.example.thanhtoannoibo.Entity.Notification;
import com.example.thanhtoannoibo.Entity.User;
import com.example.thanhtoannoibo.Exception.AppException;
import com.example.thanhtoannoibo.Common.ErrorCode;
import com.example.thanhtoannoibo.Repository.Merchant.MerchantRequestRepository;
import com.example.thanhtoannoibo.Repository.Notification.NotificationRepository;

import com.example.thanhtoannoibo.Repository.Security.UserRepository;
import com.example.thanhtoannoibo.Repository.Wallet.TransactionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class AdminRequestService {

    private final MerchantRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper;

    /**
     * 1. Lấy danh sách Request (Phân trang + Tìm kiếm đa tiêu chí)
     * - keyword: Tìm theo Tên, Email, Username của Merchant
     * - status: Lọc trạng thái (PENDING, APPROVED, REJECTED)
     * - fromDate, toDate: Lọc theo khoảng thời gian tạo
     */
    public Page<AdminMerchantRequestDetailResponse> getRequests(
            String keyword,
            String status,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Pageable pageable
    ) {
        Specification<MerchantRequest> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // A. Filter theo thời gian tạo
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), toDate));
            }

            // B. Filter theo trạng thái
            if (status != null && !status.isEmpty() && !"ALL".equalsIgnoreCase(status)) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            // C. Filter theo Merchant (Phức tạp vì không có Join trực tiếp)
            if (keyword != null && !keyword.trim().isEmpty()) {
                // 1. Tìm list UserID khớp với keyword
                List<UUID> matchedMerchantIds = userRepository.findIdsByKeyword(keyword.trim());

                if (matchedMerchantIds.isEmpty()) {
                    predicates.add(cb.disjunction()); // Không tìm thấy user -> Trả về rỗng
                } else {
                    predicates.add(root.get("merchantId").in(matchedMerchantIds));
                }
            }

            // Default Sort: Mới nhất lên đầu
            if (pageable.getSort().isUnsorted()) {
                query.orderBy(cb.desc(root.get("createdAt")));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<MerchantRequest> pageResult = requestRepository.findAll(spec, pageable);
        return pageResult.map(this::mapToDetailResponse);
    }

    /**
     * 2. Xem chi tiết 1 Request (Kèm thông tin Merchant đầy đủ)
     */
    public AdminMerchantRequestDetailResponse getRequestDetail(UUID requestId) {
        MerchantRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu"));
        return mapToDetailResponse(req);
    }

    /**
     * 3. Duyệt hoặc Từ chối Request
     * - Cập nhật trạng thái
     * - Ghi nhận người duyệt, thời gian, lý do/ảnh
     * - Gửi thông báo cho Merchant
     */
    @Transactional
    public void reviewRequest(UUID requestId, UUID adminId, AdminReviewRequest reviewDto) {
        MerchantRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu"));

        User merchant = userRepository.findById(req.getMerchantId())
                .orElseThrow(() -> new RuntimeException("Merchant không tồn tại"));

        // Update trạng thái Request
        req.setStatus(reviewDto.getStatus());
        req.setReviewedBy(adminId);
        req.setReviewedAt(LocalDateTime.now());

        String notificationTitle;
        String notificationMsg;

        if ("APPROVED".equalsIgnoreCase(reviewDto.getStatus())) {
            // Duyệt thành công -> Lưu ảnh xác thực (Bill chuyển khoản/Biên lai)
            req.setReviewImageUrl(reviewDto.getReviewImageUrl());

            notificationTitle = "Yêu cầu đã được duyệt";
            notificationMsg = "Admin đã phê duyệt yêu cầu cập nhật/đối soát của bạn.";
        } else {
            // Từ chối -> Lưu lý do
            req.setRejectionReason(reviewDto.getReason());
            req.setReviewImageUrl(null);

            notificationTitle = "Yêu cầu bị từ chối";
            notificationMsg = "Yêu cầu của bạn bị từ chối. Lý do: " + reviewDto.getReason();
        }

        requestRepository.save(req);

        // Gửi Notification
        createNotification(merchant, notificationTitle, notificationMsg);
    }

    /**
     * 4. Xuất báo cáo Excel đối soát (Theo Merchant ID được chỉ định)
     */
    public byte[] exportReconciliationReport(UUID merchantId) throws Exception {
        if (!userRepository.existsById(merchantId)) {
            throw new RuntimeException("Merchant ID không hợp lệ");
        }

        // Lấy dữ liệu từ Procedure (Repository đã có hàm này)
        List<MerchantReconciliationDTO> data = transactionRepository.getMerchantReconciliation(merchantId);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Doi Soat Admin");

            // Style Header
            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            font.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(font);
            headerStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex()); // Màu xanh cho Admin
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Columns
            String[] columns = {"Mã GD", "Thời gian", "Số tiền", "Trạng thái", "Nội dung", "Người TT", "Voucher", "Dịch vụ"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            // Fill Data
            int rowIdx = 1;
            for (MerchantReconciliationDTO dto : data) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(dto.getMaGiaoDich());
                row.createCell(1).setCellValue(dto.getThoiGian() != null ? dto.getThoiGian().toString() : "");
                row.createCell(2).setCellValue(dto.getSoTien() != null ? dto.getSoTien().doubleValue() : 0);
                row.createCell(3).setCellValue(dto.getTrangThai());
                row.createCell(4).setCellValue(dto.getNoiDung());
                row.createCell(5).setCellValue(dto.getNguoiThanhToan());
                row.createCell(6).setCellValue(dto.getMaVoucher());
                row.createCell(7).setCellValue(dto.getTenDichVuVoucher());
            }

            // Auto size
            for (int i = 0; i < columns.length; i++) sheet.autoSizeColumn(i);

            workbook.write(out);
            return out.toByteArray();
        }
    }

    // --- HELPER METHODS ---

    // Map Entity -> DTO Chi tiết
    private AdminMerchantRequestDetailResponse mapToDetailResponse(MerchantRequest req) {
        // Parse JSON
        MerchantSubmitRequest submittedData = null;
        try {
            if (req.getRequestData() != null) {
                submittedData = objectMapper.readValue(req.getRequestData(), MerchantSubmitRequest.class);
            }
        } catch (Exception e) {
            log.error("JSON Parse Error RequestID: " + req.getRequestId(), e);
        }

        // Lấy thông tin Merchant
        User merchant = userRepository.findById(req.getMerchantId()).orElse(null);

        // Lấy tên Admin duyệt (nếu có)
        String adminName = null;
        if (req.getReviewedBy() != null) {
            User admin = userRepository.findById(req.getReviewedBy()).orElse(null);
            if (admin != null) adminName = admin.getFullName();
        }

        return AdminMerchantRequestDetailResponse.builder()
                .requestId(req.getRequestId())
                .status(req.getStatus())
                .createdAt(req.getCreatedAt())
                .reviewedAt(req.getReviewedAt())
                .reviewedByName(adminName)
                .rejectionReason(req.getRejectionReason())
                .adminReviewImageUrl(req.getReviewImageUrl())

                // Info Merchant (Hiện tại trong DB)
                .merchantId(req.getMerchantId())
                .merchantUsername(merchant != null ? merchant.getUsername() : "N/A")
                .merchantCurrentName(merchant != null ? merchant.getFullName() : "Unknown")
                .merchantEmail(merchant != null ? merchant.getEmail() : "")
                .merchantPhone(merchant != null ? merchant.getPhoneNumber() : "")
                .currentQrUrl(merchant != null ? merchant.getQrPaymentUrl() : "")

                // Info Submitted (Thông tin mới gửi lên)
                .submittedFullName(submittedData != null ? submittedData.getFullName() : null)
                .submittedQrUrl(submittedData != null ? submittedData.getQrPaymentUrl() : null)
                .build();
    }

    private void createNotification(User user, String title, String message) {
        try {
            Notification notification = Notification.builder()
                    .user(user)
                    .title(title)
                    .message(message)
                    .isRead(false)
                    .type("SYSTEM")
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notification);
        } catch (Exception e) {
            log.error("Notification Error", e);
        }
    }
}