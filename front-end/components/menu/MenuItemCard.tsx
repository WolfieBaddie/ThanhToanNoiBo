import React, { useState } from 'react';
import { ShoppingBag, ImageOff, Loader2 } from 'lucide-react';
import { MenuItem } from '@/types/menu.item'; // Hoặc đường dẫn type của bạn
import { formatCurrency } from '@/utils/format';
import { useBuyVoucher } from '@/hooks/useBuyVoucher.tsx'; // Import Hook mua vé
import { ConfirmModal } from '@/components/ui/ConfirmModal'; // Import Modal vừa tạo

interface MenuItemCardProps {
    item: MenuItem;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item }) => {
    // 1. State điều khiển Modal
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 2. Sử dụng Hook logic mua vé (đã bao gồm logic check số dư & redirect)
    const { buyVoucher, isLoading } = useBuyVoucher();

    // 3. Hàm mở Modal
    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    // 4. Hàm thực hiện mua khi người dùng bấm "Xác nhận"
    const handleConfirmBuy = async () => {
        await buyVoucher(
            {
                serviceId: item.serviceId,
                amount: 1 // Mặc định mua 1 vé (có thể nâng cấp UI để chọn số lượng sau)
            },
            item.unitPrice, // Truyền giá để hook tính toán số tiền thiếu nếu cần nạp
            () => {
                // Callback khi thành công
                setIsModalOpen(false);
            }
        );
        // Lưu ý: Nếu thất bại hoặc thiếu tiền, Hook useBuyVoucher đã tự handle alert/redirect
        // nên ta chỉ cần đóng modal khi gọi xong (hoặc giữ lại nếu muốn UX khác)
        setIsModalOpen(false);
    };

    return (
        <>
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:shadow-slate-200 dark:hover:shadow-none transition-all group flex flex-col h-full">
                {/* Image Section */}
                <div className="relative h-48 overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-700">
                    {item.imageUrl ? (
                        <img
                            src={item.imageUrl}
                            alt={item.serviceName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <ImageOff size={32} />
                        </div>
                    )}

                    {/* Category Tag */}
                    <span className="absolute top-3 left-3 backdrop-blur-md bg-white/30 dark:bg-black/30 border border-white/20 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                        {item.categoryName}
                    </span>
                </div>

                {/* Content Section */}
                <div className="p-5 flex flex-col flex-1">
                    <div className="mb-2">
                        <h4 className="font-bold text-slate-800 dark:text-white text-lg line-clamp-2" title={item.serviceName}>
                            {item.serviceName}
                        </h4>
                    </div>

                    {/* Description (Optional) */}
                    {item.description && (
                        <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                            {item.description}
                        </p>
                    )}

                    {/* Footer: Price & Add Button */}
                    <div className="mt-auto flex items-center justify-between pt-4">
                        <span className="text-slate-900 dark:text-white font-extrabold text-lg">
                            {formatCurrency(item.unitPrice)}
                        </span>

                        <button
                            onClick={handleOpenModal} // Mở Modal thay vì mua ngay
                            disabled={isLoading}
                            className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <ShoppingBag size={18} />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- POPUP XÁC NHẬN --- */}
            <ConfirmModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmBuy}
                title="Xác nhận mua vé"
                isLoading={isLoading}
                message={
                    <span>
                        Bạn có chắc chắn muốn mua vé dịch vụ <br/>
                        <strong className="text-indigo-600 dark:text-indigo-400">{item.serviceName}</strong>
                        <br/> với giá <strong>{formatCurrency(item.unitPrice)}</strong> không?
                    </span>
                }
                confirmText="Mua ngay"
            />
        </>
    );
};