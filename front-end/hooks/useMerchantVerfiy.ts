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

    // Lấy hạn mức chung của Voucher (Nếu null thì mặc định 999)
    const globalLimit = useMemo(() => {
        return qrData?.usageLimit ?? 999;
    }, [qrData]);

    // Tính tổng số lượng đang chọn hiện tại (Real-time)
    const currentTotalQuantity = useMemo(() => {
        if (!isPackage) return genericQuantity;
        return Object.values(selectedItems)
            .filter(item => item.isSelected)
            .reduce((sum, item) => sum + item.quantity, 0);
    }, [selectedItems, isPackage, genericQuantity]);

    // --- INIT STATE ---
    useEffect(() => {
        if (qrData && qrData.includedServices) {
            const initialSelection: Record<string, SelectedItemState> = {};

            // Không auto select món nào cả. Để user tự chọn.
            qrData.includedServices.forEach((s) => {
                const remaining = s.remainingQuantity ?? 999;
                initialSelection[s.serviceId] = {
                    quantity: 1, // Mặc định số lượng là 1 nếu được chọn
                    isSelected: false,
                    service: s
                };
            });
            setSelectedItems(initialSelection);
        }
    }, [qrData]);

    // --- CHECK LIMIT ---
    const isOverLimit = useMemo(() => {
        return currentTotalQuantity > globalLimit;
    }, [currentTotalQuantity, globalLimit]);

    // Logic chọn món
    const toggleItem = (serviceId: string) => {
        setSelectedItems(prev => {
            const current = prev[serviceId];
            if (!current) return prev;

            // Nếu đang Uncheck -> Check (Thêm món)
            if (!current.isSelected) {
                // 1. Check hết hàng của món đó
                const itemRemaining = current.service.remainingQuantity ?? 999;
                if (itemRemaining <= 0) {
                    notify.error("Món này đã hết hàng!");
                    return prev;
                }

                // 2. Check hạn mức chung (Global Limit)
                if (currentTotalQuantity + current.quantity > globalLimit) {
                    notify.error(`Chỉ được chọn tối đa ${globalLimit} phần.`);
                    return prev;
                }
            }

            return { ...prev, [serviceId]: { ...current, isSelected: !current.isSelected } };
        });
    };

    // Logic tăng giảm số lượng
    const changeQuantity = (serviceId: string, delta: number) => {
        setSelectedItems(prev => {
            const current = prev[serviceId];
            if (!current) return prev;

            const newQty = current.quantity + delta;

            if (newQty < 1) return prev;

            // Nếu đang tăng số lượng (delta > 0)
            if (delta > 0) {
                // 1. Check hạn mức riêng của món (Stock)
                const itemMax = current.service.remainingQuantity ?? 999;
                if (newQty > itemMax) {
                    notify.error(`Món này chỉ còn ${itemMax} phần.`);
                    return prev;
                }

                // 2. Check hạn mức chung (Global Limit)
                if (currentTotalQuantity + delta > globalLimit) {
                    notify.error(`Tổng số lượng không được vượt quá ${globalLimit}.`);
                    return prev;
                }
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

            // Upload ảnh
            let uploadedUrl: string | undefined = undefined;
            if (imageFile) {
                try {
                    uploadedUrl = await qrService.uploadProof(imageFile);
                } catch (err) {
                    console.error("Upload failed", err);
                    notify.error("Lỗi upload ảnh. Vui lòng thử lại.");
                    setIsSubmitting(false);
                    return;
                }
            } else {
                notify.error("Vui lòng chụp ảnh xác thực.");
                setIsSubmitting(false);
                return;
            }

            const itemDescriptions = Object.values(selectedItems)
                .filter(i => i.isSelected)
                .map(i => `${i.quantity}x ${i.service.serviceName}`)
                .join(", ");

            // [FIXED] Quantity gửi đi phải là TỔNG SỐ LƯỢNG MÓN ĐÃ CHỌN
            // để Backend trừ đúng hạn mức (Limit) của Voucher.
            const quantityToSend = currentTotalQuantity;

            const description = isPackage
                ? `Đổi: ${itemDescriptions}`
                : `Sử dụng ${genericQuantity} voucher`;

            const requestData: ProcessQrRequest = {
                qrCode: qrData.codeString,
                billAmount: 0,
                quantity: quantityToSend, // [ĐÃ SỬA] Dùng currentTotalQuantity thay vì hardcode 1
                description: description,
                imageUrl: uploadedUrl,
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

    return {
        selectedItems,
        effectiveQuantity: currentTotalQuantity, // Trả về tổng đã tính toán chuẩn
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