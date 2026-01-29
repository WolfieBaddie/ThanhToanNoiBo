import { useState, useEffect, useMemo } from 'react';
import { useNotification } from '@/context/NotificationContext';
import { qrService } from '@/services/qr.service';
import { QrCodeResponse, ProcessQrResponse, ProcessQrRequest, QrItemRequest } from '@/types/qr.type';
import { ServiceResponse } from "@/types/catalog.type.ts";

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

    const isPackage = useMemo(() => {
        return qrData?.includedServices && qrData.includedServices.length > 0;
    }, [qrData]);

    // --- INIT STATE ---
    useEffect(() => {
        if (qrData && qrData.includedServices) {
            const initialSelection: Record<string, SelectedItemState> = {};
            qrData.includedServices.forEach(s => {
                const remaining = s.remainingQuantity ?? 999;
                const isAvailable = remaining > 0;

                initialSelection[s.serviceId] = {
                    quantity: isAvailable ? 1 : 0,
                    isSelected: isAvailable,
                    service: s
                };
            });
            setSelectedItems(initialSelection);
        }
    }, [qrData]);

    // --- CHECK LIMIT ---
    const isOverLimit = useMemo(() => {
        if (!qrData) return false;
        if (isPackage) return false; // Package check lẻ từng món
        const max = qrData.includedServices?.[0]?.remainingQuantity ?? qrData.usageLimit ?? 999;
        return genericQuantity > max;
    }, [qrData, genericQuantity, isPackage]);

    const toggleItem = (serviceId: string) => {
        setSelectedItems(prev => {
            const current = prev[serviceId];
            if (!current) return prev;
            const maxLimit = current.service.remainingQuantity ?? 999;
            if (!current.isSelected && maxLimit <= 0) {
                notify.warning("Món này đã dùng hết lượt!");
                return prev;
            }
            return { ...prev, [serviceId]: { ...current, isSelected: !current.isSelected } };
        });
    };

    const changeQuantity = (serviceId: string, delta: number) => {
        setSelectedItems(prev => {
            const current = prev[serviceId];
            if (!current) return prev;
            const newQty = current.quantity + delta;
            if (newQty < 1) return prev;
            const maxLimit = current.service.remainingQuantity ?? 999;
            if (newQty > maxLimit) {
                notify.warning(`Khách chỉ còn lại ${maxLimit} phần cho món này.`);
                return prev;
            }
            return { ...prev, [serviceId]: { ...current, quantity: newQty } };
        });
    };

    // --- IMAGE HANDLER ---
    const handleImageUpload = (file: File) => {
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            notify.error("Kích thước ảnh không được vượt quá 5MB");
            return;
        }
        setImageFile(file);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        try {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } catch (e) {
            console.error("Error creating object URL", e);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
    };

    // --- SUBMIT TRANSACTION ---
    const submitTransaction = async () => {
        if (!qrData) return;
        setIsSubmitting(true);

        try {
            // 1. Prepare Items
            const itemsPayload: QrItemRequest[] = Object.values(selectedItems)
                .filter(item => item.isSelected)
                .map(item => ({
                    serviceId: item.service.serviceId,
                    quantity: item.quantity
                }));

            if (isPackage && itemsPayload.length === 0) {
                notify.error("Vui lòng chọn ít nhất 1 món.");
                setIsSubmitting(false);
                return;
            }

            // 2. [SỬA LẠI] Upload ảnh (Dùng đúng hàm qrService.uploadProof và truyền File trực tiếp)
            let uploadedUrl: string | undefined = undefined;
            if (imageFile) {
                try {
                    // Gọi đúng hàm uploadProof trong qr.service.ts
                    uploadedUrl = await qrService.uploadProof(imageFile);
                } catch (err) {
                    console.error("Upload failed", err);
                    notify.error("Lỗi upload ảnh. Vui lòng thử lại.");
                    setIsSubmitting(false);
                    return;
                }
            } else {
                // Bắt buộc có ảnh (theo UI) -> Chặn nếu không có
                notify.error("Vui lòng chụp ảnh xác thực.");
                setIsSubmitting(false);
                return;
            }

            // 3. Prepare Request Data
            const itemDescriptions = Object.values(selectedItems)
                .filter(i => i.isSelected)
                .map(i => `${i.quantity}x ${i.service.serviceName}`)
                .join(", ");

            const quantityToSend = isPackage ? 1 : genericQuantity;
            const description = isPackage
                ? `Đổi: ${itemDescriptions}`
                : `Sử dụng ${genericQuantity} voucher`;

            const requestData: ProcessQrRequest = {
                qrCode: qrData.codeString,
                billAmount: 0,
                quantity: quantityToSend,
                description: description,
                imageUrl: uploadedUrl, // [QUAN TRỌNG] Gửi URL ảnh lên Backend
                items: isPackage ? itemsPayload : undefined,
                serviceId: (!isPackage && qrData.includedServices?.length === 1)
                    ? qrData.includedServices[0].serviceId
                    : undefined
            };

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

    const effectiveQuantityDisplay = isPackage
        ? Object.values(selectedItems).filter(i => i.isSelected).reduce((sum, i) => sum + i.quantity, 0)
        : genericQuantity;

    return {
        selectedItems,
        effectiveQuantity: effectiveQuantityDisplay,
        totalBillAmount: 0,
        previewUrl,
        isSubmitting,
        isOverLimit,
        isPackage,
        toggleItem,
        changeQuantity,
        handleImageUpload,
        removeImage,
        submitTransaction,
        genericQuantity,
        setGenericQuantity
    };
};