import { useState, useEffect, useCallback } from 'react';
import { adminMerchantService } from '@/services/admin/admin.merchant.service';
import {
    AdminMerchantDetailResponse,
    UpdateCounterRequest,
} from '@/types/admin.merchant.type';
import { UpdateServiceRequest, UpdatePackageRequest } from '@/types/admin.catalog.type';
import { CatalogStatus } from '@/types/admin.catalog.type';
import { toast } from 'react-hot-toast';

export const useAdminMerchantDetail = (merchantId: string) => {
    // Data State
    const [merchant, setMerchant] = useState<AdminMerchantDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 1. Fetch Detail
    const fetchDetail = useCallback(async () => {
        if (!merchantId) return;
        setLoading(true);
        try {
            const data = await adminMerchantService.getMerchantDetail(merchantId);
            setMerchant(data);
            setError(null);
        } catch (err: any) {
            console.error("Fetch Merchant Detail Error:", err);
            setError(err.response?.data?.message || "Không thể tải thông tin đối tác.");
            toast.error("Lỗi tải dữ liệu đối tác");
        } finally {
            setLoading(false);
        }
    }, [merchantId]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    // --- ACTIONS ---

    // 2. Cập nhật thông tin Quầy
    const updateCounterInfo = async (data: UpdateCounterRequest) => {
        setActionLoading(true);
        try {
            await adminMerchantService.updateCounter(merchantId, data);
            toast.success("Cập nhật thông tin quầy thành công");
            await fetchDetail();
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Cập nhật thất bại");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // 3. [MỚI] Cập nhật Service (Dùng chung cho cả Sửa Info và Đổi Status)
    const updateService = async (serviceId: string, data: UpdateServiceRequest) => {
        setActionLoading(true);
        try {
            await adminMerchantService.updateMerchantService(serviceId, data);

            // Thông báo tùy ngữ cảnh
            if (data.status) {
                toast.success(`Cập nhật trạng thái dịch vụ: ${data.status}`);
            } else {
                toast.success("Cập nhật thông tin dịch vụ thành công");
            }

            await fetchDetail();
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Thao tác thất bại");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // Helper: Đổi status nhanh cho Service (Backward compatibility)
    const changeServiceStatus = async (serviceId: string, status: CatalogStatus, reason: string = "") => {
        // Gọi hàm updateService chỉ với trường status
        // Các trường khác để undefined hoặc null, Backend sẽ bỏ qua không update
        const payload: UpdateServiceRequest = {
            status: status,
            description: reason, // Tạm dùng field description để truyền reason nếu cần log, hoặc backend tự xử lý
            // Các field khác không gửi
            serviceName: undefined as any,
            unitPrice: undefined as any,
            imageUrl: undefined as any,
            categoryId: undefined as any,
            assignedCounterIds: undefined as any
        };
        return await updateService(serviceId, payload);
    };

    // 4. [MỚI] Cập nhật Package (Dùng chung cho cả Sửa Info và Đổi Status)
    const updatePackage = async (packageId: string, data: UpdatePackageRequest) => {
        setActionLoading(true);
        try {
            await adminMerchantService.updateMerchantPackage(packageId, data);

            if (data.status) {
                toast.success(`Cập nhật trạng thái gói: ${data.status}`);
            } else {
                toast.success("Cập nhật thông tin gói thành công");
            }

            await fetchDetail();
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Thao tác thất bại");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    // Helper: Đổi status nhanh cho Package
    const changePackageStatus = async (packageId: string, status: CatalogStatus, reason: string = "") => {
        const payload: UpdatePackageRequest = {
            status: status,
            description: reason,
            packageName: undefined as any,
            price: undefined as any,
            packageType: undefined as any,
            creditValue: undefined as any,
            serviceIds: undefined as any
        };
        return await updatePackage(packageId, payload);
    };

    return {
        merchant,
        loading,
        actionLoading,
        error,
        refresh: fetchDetail,
        // Actions
        updateCounterInfo,
        updateService,       // Hàm sửa full info service
        updatePackage,       // Hàm sửa full info package
        changeServiceStatus, // Hàm đổi status nhanh (Duyệt/Khóa)
        changePackageStatus  // Hàm đổi status nhanh (Duyệt/Khóa)
    };
};