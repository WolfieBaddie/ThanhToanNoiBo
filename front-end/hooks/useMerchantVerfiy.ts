// src/hooks/useMerchantVerfiy.ts

import { useState, useEffect, useMemo } from 'react';
import { useNotification } from '@/context/NotificationContext';
import { qrService } from '@/services/qr.service';
// Thêm ProcessQrRequest vào import
import { QrCodeResponse, ProcessQrResponse, ProcessQrRequest } from '@/types/qr.type';
import { ServiceResponse } from "@/types/catalog.type.ts";

// Interface định nghĩa trạng thái của từng món được chọn
interface SelectedItemState {
    quantity: number;
    isSelected: boolean;
    service: ServiceResponse;
}

export const useMerchantVerify = (
    qrData: QrCodeResponse | null,
    onSuccess?: (data: ProcessQrResponse) => void
) => {
    const notify = useNotification();

    // --- STATE ---
    const [selectedItems, setSelectedItems] = useState<Record<string, SelectedItemState>>({});
    const [genericQuantity, setGenericQuantity] = useState(1);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- INIT: Khởi tạo danh sách món từ QR Data ---
    useEffect(() => {
        if (qrData && qrData.includedServices && qrData.includedServices.length > 0) {
            const initialMap: Record<string, SelectedItemState> = {};
            qrData.includedServices.forEach(service => {
                initialMap[service.serviceId] = {
                    quantity: 1,
                    isSelected: false,
                    service: service
                };
            });
            setSelectedItems(initialMap);
        }
    }, [qrData]);

    // --- COMPUTED: Tính toán số lượng và tổng tiền ---

    // [FIX LỖI ĐỎ TS]: Ép kiểu (item as SelectedItemState) để cộng quantity
    const totalSelectedQty = useMemo(() => {
        if (!qrData) return 0;
        if (qrData.includedServices && qrData.includedServices.length > 0) {
            return Object.values(selectedItems)
                .filter(item => item.isSelected)
                .reduce((sum, item) => sum + (item as SelectedItemState).quantity, 0);
        }
        return genericQuantity;
    }, [qrData, selectedItems, genericQuantity]);

    // [FIX LỖI ĐỎ TS]: Ép kiểu để tính tiền (unitPrice * quantity)
    const totalBillAmount = useMemo(() => {
        if (!qrData) return 0;
        if (qrData.includedServices && qrData.includedServices.length > 0) {
            return Object.values(selectedItems)
                .filter(item => item.isSelected)
                .reduce((sum, item) => {
                    const typedItem = item as SelectedItemState;
                    return sum + (typedItem.service.unitPrice * typedItem.quantity);
                }, 0);
        }
        return qrData.creditAmount * genericQuantity;
    }, [qrData, selectedItems, genericQuantity]);

    // --- HANDLERS: Xử lý sự kiện (Giữ nguyên) ---
    const toggleItem = (serviceId: string) => {
        setSelectedItems(prev => ({
            ...prev,
            [serviceId]: { ...prev[serviceId], isSelected: !prev[serviceId].isSelected }
        }));
    };

    const changeQuantity = (serviceId: string, delta: number) => {
        setSelectedItems(prev => {
            const currentItem = prev[serviceId];
            const newQty = currentItem.quantity + delta;
            if (newQty < 1) return prev;
            return {
                ...prev,
                [serviceId]: { ...currentItem, quantity: newQty }
            };
        });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
    };

    // --- SUBMIT TRANSACTION: Xử lý gửi dữ liệu ---
    const submitTransaction = async () => {
        if (!qrData) return;

        // Validation cơ bản
        if (!imageFile) {
            notify.error("Vui lòng chụp ảnh xác thực trước khi hoàn tất.");
            return;
        }

        // [QUAN TRỌNG]: Lấy danh sách các món thực tế đã chọn và ép kiểu mảng
        const selectedItemsList = Object.values(selectedItems)
            .filter(i => i.isSelected) as SelectedItemState[];

        if (totalSelectedQty <= 0) {
            notify.error("Vui lòng chọn ít nhất 1 món hoặc 1 vé.");
            return;
        }
        if (qrData.usageLimit && totalSelectedQty > qrData.usageLimit) {
            notify.error(`Vượt quá giới hạn sử dụng (${qrData.usageLimit}).`);
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Upload ảnh xác thực
            const uploadedImageUrl = await qrService.uploadProof(imageFile);

            // 2. Tạo mô tả giao dịch (Description)
            const itemDescriptions = selectedItemsList
                .map(i => `${i.quantity} ${i.service.serviceName}`)
                .join(", ");

            const description = itemDescriptions
                ? `Đổi: ${itemDescriptions}`
                : `Sử dụng ${totalSelectedQty} voucher`;

            // 3. Chuẩn bị payload gửi xuống Backend
            const requestData: ProcessQrRequest = {
                qrCode: qrData.codeString,
                billAmount: totalBillAmount,
                quantity: totalSelectedQty,
                description: description,
                imageUrl: uploadedImageUrl,

                // [FIX LOGIC SERVICE ID]:
                // - Ưu tiên 1: Lấy ID món đầu tiên trong danh sách chọn (Dành cho Package/Multi-service)
                // - Ưu tiên 2: Lấy ID từ qrData (Dành cho Voucher 1 món duy nhất)
                // - Cuối cùng: undefined (Backend sẽ xử lý mặc định hoặc báo lỗi nếu cần thiết)
                serviceId: selectedItemsList.length > 0
                    ? selectedItemsList[0].service.serviceId
                    : (qrData.includedServices?.length === 1 ? qrData.includedServices[0].serviceId : undefined)
            };

            // 4. Gọi API
            const res = await qrService.redeem(requestData);

            notify.success(`Giao dịch thành công!`);

            if (onSuccess) onSuccess(res);

        } catch (error: any) {
            console.error("Redeem Error:", error);
            const msg = error.response?.data?.message || "Giao dịch thất bại.";
            notify.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        selectedItems,
        totalSelectedQty,
        totalBillAmount,
        previewUrl,
        isSubmitting,
        toggleItem,
        changeQuantity,
        handleImageUpload,
        removeImage,
        submitTransaction,
        setGenericQuantity
    };
};