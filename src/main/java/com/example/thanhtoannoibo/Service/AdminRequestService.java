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
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
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

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
            .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

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
    public byte[] exportReconciliationReport(UUID merchantId, int month, int year) {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // 1. Gọi Repo lấy dữ liệu
            List<MerchantReconciliationDTO> data = transactionRepository.getMerchantReconciliation(merchantId, month, year);

            Sheet sheet = workbook.createSheet("Doi_soat_T" + month + "_" + year);

            // Biến tích lũy tổng
            BigDecimal totalRevenue = BigDecimal.ZERO;
            BigDecimal totalTax = BigDecimal.ZERO;
            BigDecimal totalFee = BigDecimal.ZERO;
            BigDecimal totalNet = BigDecimal.ZERO;

            // Định nghĩa hằng số chia để tính thuế (1.1)
            BigDecimal DIVISOR_TAX = new BigDecimal("1.1");

            // --- BƯỚC 1: LOOP TÍNH TOÁN LẠI DỮ LIỆU ---
            // Chúng ta cần tính toán trước hoặc tính trong khi lặp để ra tổng
            // Ở đây tôi sẽ tính toán lại từng dòng khi ghi vào Excel, nhưng cần tính tổng trước để ghi Header

            // Tuy nhiên, logic ghi Header trước -> Ghi Data sau.
            // Nên ta sẽ vừa lặp data để ghi, vừa cộng dồn. Nhưng Header lại nằm trên cùng?
            // => Cách giải quyết: Ghi Header (Row 0-4) SAU KHI chạy vòng lặp data,
            // hoặc dùng công thức Excel, nhưng ở đây ta tính Java cho chắc ăn.

            // Cách tốt nhất: Chạy 1 vòng lặp để tính toán và lưu các giá trị đã tính vào list tạm hoặc tính thẳng vào Cell rồi cộng dồn.

            // Khởi tạo style
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);
            CellStyle boldStyle = createHeaderStyle(workbook);
            CellStyle currencyStyle = workbook.createCellStyle();
            DataFormat format = workbook.createDataFormat();
            currencyStyle.setDataFormat(format.getFormat("#,##0")); // Format số đẹp

            // Tạo Header Row cho bảng dữ liệu (Bắt đầu từ dòng 6)
            int headerRowIdx = 6;
            Row headerTable = sheet.createRow(headerRowIdx);
            String[] headers = {
                    "Mã GD", "Thời gian", "Trạng thái", "Nội dung",
                    "Tiền gốc", "Thuế VAT (10%)", "Tổng khách trả", "Phí sàn", "Thực nhận",
                    "Người trả", "Email", "SĐT", "Voucher", "Hạn SD Voucher"
            };
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerTable.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(boldStyle);
            }

            // --- BƯỚC 2: GHI DỮ LIỆU VÀ TÍNH TOÁN ---
            int rowIdx = headerRowIdx + 1;

            for (MerchantReconciliationDTO dto : data) {
                Row row = sheet.createRow(rowIdx++);

                // Lấy dữ liệu thô
                BigDecimal grossAmount = dto.getTongThanhToan() != null ? dto.getTongThanhToan() : BigDecimal.ZERO;
                BigDecimal fee = dto.getPhiSan() != null ? dto.getPhiSan() : BigDecimal.ZERO;

                // --- [LOGIC TÍNH THUẾ 10% TẠI ĐÂY] ---
                // 1. Tính giá gốc (Net Price) = Tổng / 1.1
                BigDecimal netPrice = grossAmount.divide(DIVISOR_TAX, 0, java.math.RoundingMode.HALF_UP);

                // 2. Tính Thuế = Tổng - Giá gốc
                BigDecimal calculatedTax = grossAmount.subtract(netPrice);

                // 3. Tính Thực nhận = Tổng - Thuế - Phí sàn
                BigDecimal calculatedNet = grossAmount.subtract(calculatedTax).subtract(fee);
                // -------------------------------------

                // Cộng dồn vào tổng (Summary)
                totalRevenue = totalRevenue.add(grossAmount);
                totalTax = totalTax.add(calculatedTax);
                totalFee = totalFee.add(fee);
                totalNet = totalNet.add(calculatedNet);

                // Ghi vào Cell
                row.createCell(0).setCellValue(dto.getMaGiaoDich());
                if (dto.getThoiGian() != null) {
                    row.createCell(1).setCellValue(DATE_FORMATTER.format(dto.getThoiGian()));
                }
                row.createCell(2).setCellValue(dto.getTrangThai());
                row.createCell(3).setCellValue(dto.getNoiDung());

                // Các cột số liệu
                createNumberCell(row, 4, netPrice, currencyStyle);       // Tiền gốc (Đã trừ thuế)
                createNumberCell(row, 5, calculatedTax, currencyStyle);  // Thuế (Tính lại)
                createNumberCell(row, 6, grossAmount, currencyStyle);    // Tổng khách trả
                createNumberCell(row, 7, fee, currencyStyle);            // Phí sàn
                createNumberCell(row, 8, calculatedNet, currencyStyle);  // Thực nhận (Tính lại)

                // Thông tin khách
                row.createCell(9).setCellValue(dto.getNguoiThanhToan());
                row.createCell(10).setCellValue(dto.getEmailKhach());
                row.createCell(11).setCellValue(dto.getSdtKhach());
                row.createCell(12).setCellValue(dto.getMaVoucher());
                if (dto.getHanSuDungVoucher() != null) {
                    row.createCell(13).setCellValue(DATE_FORMATTER.format(dto.getHanSuDungVoucher()));
                }
            }

            // --- BƯỚC 3: GHI PHẦN TỔNG HỢP (SUMMARY) Ở ĐẦU TRANG ---
            // (Giờ mới ghi vì đã có số liệu tổng sau khi lặp)

            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("BÁO CÁO ĐỐI SOÁT THÁNG " + month + "/" + year);
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 5));

            // Row 1: Tổng doanh thu
            Row sumRow1 = sheet.createRow(1);
            sumRow1.createCell(0).setCellValue("Tổng doanh thu (Gross):");
            sumRow1.getCell(0).setCellStyle(boldStyle);
            createNumberCell(sumRow1, 1, totalRevenue, currencyStyle);

            // Row 2: Tổng thuế (Đã tính lại)
            Row sumRow2 = sheet.createRow(2);
            sumRow2.createCell(0).setCellValue("Tổng thuế VAT (10%):");
            sumRow2.getCell(0).setCellStyle(boldStyle);
            createNumberCell(sumRow2, 1, totalTax, currencyStyle);

            // Row 3: Tổng phí sàn
            Row sumRow3 = sheet.createRow(3);
            sumRow3.createCell(0).setCellValue("Tổng phí sàn:");
            sumRow3.getCell(0).setCellStyle(boldStyle);
            createNumberCell(sumRow3, 1, totalFee, currencyStyle);

            // Row 4: Tổng thực nhận
            Row sumRow4 = sheet.createRow(4);
            sumRow4.createCell(0).setCellValue("TỔNG THỰC NHẬN (NET):");
            sumRow4.getCell(0).setCellStyle(boldStyle);
            createNumberCell(sumRow4, 1, totalNet, currencyStyle);

            // Auto size cột
            for(int i=0; i<headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();

        } catch (Exception e) {
            log.error("Error exporting excel for admin", e);
            throw new RuntimeException("Lỗi xuất file báo cáo phía Admin");
        }
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        return style;
    }

    private void setNumericCell(Row row, int colIndex, BigDecimal value) {
        Cell cell = row.createCell(colIndex);
        if (value != null) {
            cell.setCellValue(value.doubleValue());
        } else {
            cell.setCellValue(0);
        }
    }

    private void createNumberCell(Row row, int colIndex, BigDecimal value, CellStyle style) {
        Cell cell = row.createCell(colIndex);
        if (value != null) {
            cell.setCellValue(value.doubleValue());
        } else {
            cell.setCellValue(0);
        }
        if (style != null) {
            cell.setCellStyle(style);
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