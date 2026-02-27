import { axiosClient } from '@/lib/axios-client';
import {
    AdminMerchantRequestDetailResponse,
    AdminRequestFilter,
    AdminReviewRequest
} from '@/types/admin.request.type';

// Interface hỗ trợ phân trang chuẩn Spring Boot
interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}

export const adminRequestService = {
    // 1. Lấy danh sách Request
    getRequests: async (params: AdminRequestFilter): Promise<PageResponse<AdminMerchantRequestDetailResponse>> => {
        const response = await axiosClient.get('/admin/merchant-requests', { params });
        return response as unknown as PageResponse<AdminMerchantRequestDetailResponse>;
    },

    // 2. Xem chi tiết Request
    getRequestDetail: async (id: string): Promise<AdminMerchantRequestDetailResponse> => {
        const response = await axiosClient.get(`/admin/merchant-requests/${id}`);
        return response as unknown as AdminMerchantRequestDetailResponse;
    },

    // 3. Duyệt hoặc Từ chối
    reviewRequest: async (id: string, data: AdminReviewRequest): Promise<void> => {
        await axiosClient.post(`/admin/merchant-requests/${id}/review`, data);
    },

    /**
     * 4. Xuất báo cáo Excel [ĐÃ FIX]
     * - Dùng axiosClient (đã có Cookie Auth + Fix Interceptor)
     * - Nhận về Blob và tạo link tải
     */
    exportReconciliationReport: async (merchantId: string, month: number, year: number): Promise<void> => {
        // Gọi API với merchantId, month, year
        const data = await axiosClient.get('/admin/merchant-requests/export-report', {
            params: { merchantId, month, year },
            responseType: 'blob'
        });

        // Tạo Blob object
        const blob = new Blob([data as any], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        // Tạo link tải file: admin_reconciliation_report_ID_T2_2026.xlsx
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `admin_reconciliation_report_${merchantId}_T${month}_${year}.xlsx`);
        document.body.appendChild(link);
        link.click();

        // Cleanup
        link.remove();
        window.URL.revokeObjectURL(url);
    }
};