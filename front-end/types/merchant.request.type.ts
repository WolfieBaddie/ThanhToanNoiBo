import { BaseResponse } from './admin.catalog.type';

// 1. Request gửi lên để tạo yêu cầu mới
export interface MerchantSubmitRequest {
    fullName: string;
    phoneNumber: string;
    qrPaymentUrl: string;
}

// 2. Response trả về danh sách lịch sử yêu cầu
export interface MerchantRequestResponse {
    requestId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    submittedFullName: string;
    submittedQrUrl: string;
    rejectionReason: string | null;
    adminReviewImageUrl: string | null;
    reviewedAt: string | null;
}

// 3. DTO Đối soát (Reconciliation) trả về từ Procedure
export interface MerchantReconciliationDTO {
    maGiaoDich: string;
    thoiGian: string;
    soTien: number;
    trangThai: string;
    noiDung: string;
    nguoiThanhToan: string;
    emailKhach: string;
    sdtKhach: string;
    maVoucher: string | null;
    tenDichVuVoucher: string | null;
    qrNhanTien: string;
}