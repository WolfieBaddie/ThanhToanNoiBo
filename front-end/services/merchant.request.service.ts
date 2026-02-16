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

    exportReconciliationExcel: async (month: number, year: number): Promise<void> => {
        const response = await axiosClient.get('/merchant/reconciliation/export', {
            params: { month, year }, // Truyền tham số
            responseType: 'blob'
        });

        // Xử lý file blob
        const blob = new Blob([response as any], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `DoiSoat_T${month}_${year}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
};