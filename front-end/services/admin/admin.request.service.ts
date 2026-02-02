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
    exportReconciliationReport: async (merchantId: string): Promise<void> => {
        // Gọi API với responseType là blob để nhận file binary
        // Biến 'data' ở đây chính là cục Blob (do Interceptor trả về trực tiếp)
        const data = await axiosClient.get('/admin/merchant-requests/export-report', {
            params: { merchantId },
            responseType: 'blob'
        });

        // Tạo Blob object từ dữ liệu trả về
        const blob = new Blob([data as any], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        // Tạo link ảo trong DOM để trigger download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `admin_reconciliation_report_${merchantId}.xlsx`);
        document.body.appendChild(link);

        link.click(); // Tự động click để tải về

        // Dọn dẹp bộ nhớ
        link.remove();
        window.URL.revokeObjectURL(url);
    }
};