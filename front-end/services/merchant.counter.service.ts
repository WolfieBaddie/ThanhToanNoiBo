// src/services/merchant.counter.service.ts

import { axiosClient } from '@/lib/axios-client';
import {
    Counter,
    CreateCounterRequest,
    UpdateCounterRequest
} from '@/types/merchant.type';

export const merchantCounterService = {

    /**
     * Lấy thông tin chi tiết quầy
     * GET /api/merchant/counters
     * Response trả về là object Counter luôn (do axios-client đã unwrap)
     */
    getCounterDetail: async (): Promise<Counter> => {
        return await axiosClient.get('/merchant/counters');
    },

    /**
     * Tạo quầy hàng mới
     * POST /api/merchant/counters
     */
    createCounter: async (data: CreateCounterRequest): Promise<Counter> => {
        return await axiosClient.post('/merchant/counters', data);
    },

    /**
     * Cập nhật thông tin quầy hàng
     * PUT /api/merchant/counters/{counterId}
     */
    updateCounter: async (counterId: string, data: UpdateCounterRequest): Promise<Counter> => {
        return await axiosClient.put(`/merchant/counters/${counterId}`, data);
    },

    /**
     * Xóa (Khóa) quầy hàng
     * DELETE /api/merchant/counters/{counterId}
     * Trả về void (null)
     */
    deleteCounter: async (counterId: string): Promise<void> => {
        return await axiosClient.delete(`/merchant/counters/${counterId}`);
    }
};