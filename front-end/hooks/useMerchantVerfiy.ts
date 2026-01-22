// src/hooks/useMerchantVerfiy.ts

import { useState, useEffect, useMemo } from 'react';
import { useNotification } from '@/context/NotificationContext';
import { qrService } from '@/services/qr.service';
// Import đúng type đã sửa
import { QrCodeResponse, ProcessQrResponse } from '@/types/qr.type';
import { ServiceResponse } from "@/types/catalog.type.ts";

interface SelectedItemState {
    quantity: number;
    isSelected: boolean;
    service: ServiceResponse;
}

export const useMerchantVerify = (
    qrData: QrCodeResponse | null,
    // [QUAN TRỌNG] Định nghĩa rõ type trả về cho callback
    onSuccess?: (data: ProcessQrResponse) => void
) => {
    const notify = useNotification();

    // --- STATE ---
    const [selectedItems, setSelectedItems] = useState<Record<string, SelectedItemState>>({});
    const [genericQuantity, setGenericQuantity] = useState(1);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- INIT ---
    useEffect(() => {
        if (qrData && qrData.includedServices?.length > 0) {
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

    // --- COMPUTED ---
    const totalSelectedQty = useMemo(() => {
        if (!qrData) return 0;
        if (qrData.includedServices?.length > 0) {
            return Object.values(selectedItems)
                .filter(item => item.isSelected)
                .reduce((sum, item) => sum + item.quantity, 0);
        }
        return genericQuantity;
    }, [qrData, selectedItems, genericQuantity]);

    const totalBillAmount = useMemo(() => {
        if (!qrData) return 0;
        if (qrData.includedServices?.length > 0) {
            return Object.values(selectedItems)
                .filter(item => item.isSelected)
                .reduce((sum, item) => sum + (item.service.unitPrice * item.quantity), 0);
        }
        return qrData.creditAmount * genericQuantity;
    }, [qrData, selectedItems, genericQuantity]);

    // --- HANDLERS (Toggle, Quantity, Image) GIỮ NGUYÊN ---
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

    // --- SUBMIT TRANSACTION ---
    const submitTransaction = async () => {
        if (!qrData) return;

        // Validation
        if (!imageFile) {
            notify.error("Vui lòng chụp ảnh xác thực trước khi hoàn tất.");
            return;
        }
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
            // 1. Upload ảnh
            const uploadedImageUrl = await qrService.uploadProof(imageFile);

            // 2. Tạo Description
            const itemDescriptions = Object.values(selectedItems)
                .filter(i => i.isSelected)
                .map(i => `${i.quantity} ${i.service.serviceName}`)
                .join(", ");

            const description = itemDescriptions
                ? `Đổi: ${itemDescriptions}`
                : `Sử dụng ${totalSelectedQty} voucher`;

            // 3. Chuẩn bị payload
            const requestData = {
                qrCode: qrData.codeString,
                billAmount: totalBillAmount,
                quantity: totalSelectedQty,
                description: description,
                imageUrl: uploadedImageUrl,
                // Nếu dùng voucher single service, gửi serviceId lên để backend validate kỹ hơn (optional)
                serviceId: (qrData.includedServices?.length === 1) ? qrData.includedServices[0].serviceId : undefined
            };

            // 4. Gọi API
            // res bây giờ sẽ đúng chuẩn ProcessQrResponse (có transactionRef)
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