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
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
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

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
            .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    /**
     * 1. Merchant tự cập nhật thông tin (Tên & QR)
     * - Lưu lịch sử vào bảng merchant_requests (để trace lại sau này)
     * - Update thẳng vào bảng User
     * - Tạo Notification thông báo
     */
    @Transactional
    public void submitUpdateInfoRequest(User merchant, MerchantSubmitRequest dto) throws Exception {
        LocalDate today = LocalDate.now();
        int lastDayOfMonth = today.lengthOfMonth();

        if (today.getDayOfMonth() < (lastDayOfMonth - 1)) {
            throw new RuntimeException("Chưa đến kỳ kết toán. Bạn chỉ được gửi yêu cầu vào 2 ngày cuối tháng.");
        }

        // A. Lưu lịch sử request (Log lại việc thay đổi)
        MerchantRequest request = MerchantRequest.builder()
                .merchantId(merchant.getUserId())
                .requestType("WITHDRAWAL")
                .requestData(objectMapper.writeValueAsString(dto))
                .status("PENDING") // Tự động Approved vì update luôn
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
            log.info("Tạo yêu cầu đối soát thành công", merchant.getUserId());

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
    public List<MerchantReconciliationDTO> getReconciliationData(UUID merchantId, int month, int year) {
        // Gọi xuống Repository với đủ 3 tham số
        return transactionRepository.getMerchantReconciliation(merchantId, month, year);
    }

    /**
     * 4. Xuất file Excel đối soát
     */
    public byte[] exportReconciliationExcel(UUID merchantId, int month, int year) {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // 1. Lấy dữ liệu
            List<MerchantReconciliationDTO> data = transactionRepository.getMerchantReconciliation(merchantId, month, year);

            Sheet sheet = workbook.createSheet("Doi_soat_T" + month + "_" + year);

            // Các biến tích lũy
            BigDecimal totalRevenue = BigDecimal.ZERO;
            BigDecimal totalTax = BigDecimal.ZERO;
            BigDecimal totalFee = BigDecimal.ZERO;
            BigDecimal totalNet = BigDecimal.ZERO;

            BigDecimal DIVISOR_TAX = new BigDecimal("1.1");

            // --- STYLE ---
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);

            CellStyle boldStyle = createHeaderStyle(workbook);

            CellStyle currencyStyle = workbook.createCellStyle();
            DataFormat format = workbook.createDataFormat();
            currencyStyle.setDataFormat(format.getFormat("#,##0"));

            // --- HEADER TABLE (Dòng 6) ---
            int headerRowIdx = 6;
            Row headerRow = sheet.createRow(headerRowIdx);
            String[] headers = {
                    "Mã GD", "Thời gian", "Trạng thái", "Nội dung",
                    "Tiền gốc (Net)", "Thuế VAT (10%)", "Tổng khách trả", "Phí sàn", "Thực nhận",
                    "Người trả", "Email", "SĐT", "Voucher", "Hạn SD Voucher"
            };

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(boldStyle);
            }

            // --- DATA ROWS (Từ dòng 7) ---
            int rowIdx = headerRowIdx + 1;
            for (MerchantReconciliationDTO dto : data) {
                Row row = sheet.createRow(rowIdx++);

                // 1. Tính toán lại
                BigDecimal grossAmount = dto.getTongThanhToan() != null ? dto.getTongThanhToan() : BigDecimal.ZERO;
                BigDecimal fee = dto.getPhiSan() != null ? dto.getPhiSan() : BigDecimal.ZERO;

                // Net = Gross / 1.1
                BigDecimal netPrice = grossAmount.divide(DIVISOR_TAX, 0, RoundingMode.HALF_UP);
                // Tax = Gross - Net
                BigDecimal calculatedTax = grossAmount.subtract(netPrice);
                // Real Net = Gross - Tax - Fee
                BigDecimal calculatedNet = grossAmount.subtract(calculatedTax).subtract(fee);

                // 2. Cộng dồn
                totalRevenue = totalRevenue.add(grossAmount);
                totalTax = totalTax.add(calculatedTax);
                totalFee = totalFee.add(fee);
                totalNet = totalNet.add(calculatedNet);

                // 3. Ghi dữ liệu
                row.createCell(0).setCellValue(dto.getMaGiaoDich());
                if (dto.getThoiGian() != null) {
                    row.createCell(1).setCellValue(DATE_FORMATTER.format(dto.getThoiGian()));
                }
                row.createCell(2).setCellValue(dto.getTrangThai());
                row.createCell(3).setCellValue(dto.getNoiDung());

                // Ghi số liệu tài chính đã tính
                setNumericCell(row, 4, netPrice, currencyStyle);
                setNumericCell(row, 5, calculatedTax, currencyStyle);
                setNumericCell(row, 6, grossAmount, currencyStyle);
                setNumericCell(row, 7, fee, currencyStyle);
                setNumericCell(row, 8, calculatedNet, currencyStyle);

                row.createCell(9).setCellValue(dto.getNguoiThanhToan());
                row.createCell(10).setCellValue(dto.getEmailKhach());
                row.createCell(11).setCellValue(dto.getSdtKhach());
                row.createCell(12).setCellValue(dto.getMaVoucher());
                if (dto.getHanSuDungVoucher() != null) {
                    row.createCell(13).setCellValue(DATE_FORMATTER.format(dto.getHanSuDungVoucher()));
                }
            }

            // --- SUMMARY (Đầu trang - Dòng 0-4) ---
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("BÁO CÁO ĐỐI SOÁT THÁNG " + month + "/" + year);
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 5));

            Row sumRow1 = sheet.createRow(1);
            sumRow1.createCell(0).setCellValue("Tổng doanh thu (Gross):");
            sumRow1.getCell(0).setCellStyle(boldStyle);
            setNumericCell(sumRow1, 1, totalRevenue, currencyStyle);

            Row sumRow2 = sheet.createRow(2);
            sumRow2.createCell(0).setCellValue("Tổng thuế VAT (10%):");
            sumRow2.getCell(0).setCellStyle(boldStyle);
            setNumericCell(sumRow2, 1, totalTax, currencyStyle);

            Row sumRow3 = sheet.createRow(3);
            sumRow3.createCell(0).setCellValue("Tổng phí sàn:");
            sumRow3.getCell(0).setCellStyle(boldStyle);
            setNumericCell(sumRow3, 1, totalFee, currencyStyle);

            Row sumRow4 = sheet.createRow(4);
            sumRow4.createCell(0).setCellValue("TỔNG THỰC NHẬN (NET):");
            sumRow4.getCell(0).setCellStyle(boldStyle);
            setNumericCell(sumRow4, 1, totalNet, currencyStyle);

            // Auto size
            for(int i=0; i<headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();

        } catch (Exception e) {
            log.error("Error exporting excel", e);
            throw new RuntimeException("Lỗi xuất file báo cáo");
        }
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        return style;
    }

    private void setNumericCell(Row row, int colIndex, BigDecimal value, CellStyle style) {
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