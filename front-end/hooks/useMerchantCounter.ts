// src/hooks/useMerchantCounter.ts

import { useState, useCallback } from 'react';
import { merchantCounterService } from '@/services/merchant.counter.service';
import {
    Counter,
    CreateCounterRequest,
    UpdateCounterRequest
} from '@/types/merchant.type';
import { useNotification } from '@/context/NotificationContext';

export const useMerchantCounter = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [counter, setCounter] = useState<Counter | null>(null);
    const notify = useNotification();

    // 1. Lấy chi tiết Counter (GET)
    const fetchCounter = useCallback(async () => {
        setIsLoading(true);
        try {
            // axios-client đã trả về data gốc (Counter object), không cần .data nữa
            const data = await merchantCounterService.getCounterDetail();
            setCounter(data);
            return data;
        } catch (error: any) {
            // Xử lý lỗi (Ví dụ 404 chưa có quầy)
            console.error("Fetch counter error:", error);
            // Không nhất thiết phải notify lỗi ở đây nếu muốn handle ở UI (ví dụ hiện nút Tạo mới)
            setCounter(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 2. Tạo quầy hàng (POST)
    const createCounter = async (reqData: CreateCounterRequest) => {
        setIsLoading(true);
        try {
            const newCounter = await merchantCounterService.createCounter(reqData);
            setCounter(newCounter); // Update state ngay lập tức
            notify.success("Tạo quầy hàng thành công!");
            return newCounter;
        } catch (error: any) {
            const msg = error.response?.data?.message || "Tạo quầy thất bại.";
            notify.error(msg);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // 3. Cập nhật quầy hàng (PUT)
    const updateCounter = async (counterId: string, reqData: UpdateCounterRequest) => {
        setIsLoading(true);
        try {
            const updatedCounter = await merchantCounterService.updateCounter(counterId, reqData);
            setCounter(updatedCounter);

            if (reqData.status === 'INACTIVE') {
                notify.warning("Quầy đã tạm ngưng. Các voucher liên quan đã bị khóa.");
            } else {
                notify.success("Cập nhật thông tin thành công.");
            }
            return updatedCounter;
        } catch (error: any) {
            const msg = error.response?.data?.message || "Cập nhật thất bại.";
            notify.error(msg);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // 4. Xóa (Khóa) quầy hàng (DELETE)
    const deleteCounter = async (counterId: string) => {
        setIsLoading(true);
        try {
            await merchantCounterService.deleteCounter(counterId);

            // Cập nhật state local: set status sang INACTIVE thay vì null (để vẫn hiện thông tin nhưng disable)
            setCounter(prev => prev ? { ...prev, status: 'INACTIVE' } : null);

            notify.success("Quầy hàng đã bị khóa và ngưng hoạt động.");
        } catch (error: any) {
            const msg = error.response?.data?.message || "Xóa quầy thất bại.";
            notify.error(msg);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        counter,
        setCounter,
        isLoading,
        fetchCounter,   
        createCounter,
        updateCounter,
        deleteCounter
    };
};