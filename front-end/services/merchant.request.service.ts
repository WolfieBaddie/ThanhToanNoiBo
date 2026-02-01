import { axiosClient } from '@/lib/axios-client';
import {MerchantSubmitRequest, MerchantRequestResponse, MerchantReconciliationDTO} from "@/types/merchant.request.type.ts";


export const merchantService = {
    // Gửi yêu cầu cập nhật
    submitRequest: (data: MerchantSubmitRequest): Promise<void> =>
        axiosClient.post('/merchant/requests', data),

    // Lấy lịch sử yêu cầu
    getMyRequests: (): Promise<MerchantRequestResponse[]> =>
        axiosClient.get('/merchant/requests'),

    // Lấy dữ liệu đối soát
    getReconciliation: (): Promise<MerchantReconciliationDTO[]> =>
        axiosClient.get('/merchant/reconciliation'),

    getRequestDetail: (id: string): Promise<MerchantRequestResponse> =>
        axiosClient.get(`/merchant/requests/${id}`),

    // [CẬP NHẬT] Lấy URL để xuất Excel (Dùng window.location để browser tự tải)
    getExportReconciliationUrl: () => {
        const baseUrl = axiosClient.defaults.baseURL || '';
        // Xử lý để tránh 2 dấu gạch chéo nếu baseURL có / ở cuối
        const cleanBaseUrl = baseUrl.replace(/\/$/, '');
        return `${cleanBaseUrl}/merchant/reconciliation/export`;
    }
};