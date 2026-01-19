import React, { useState } from 'react';
import { ShoppingBag, ImageOff, Loader2, Minus, Plus } from 'lucide-react';
import { MenuItem } from '@/types/menu.item';
import { formatCurrency } from '@/utils/format';
import { useBuyVoucher } from '@/hooks/useBuyVoucher.tsx';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface MenuItemCardProps {
    item: MenuItem;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item }) => {
    // 1. State điều khiển Modal & Số lượng
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [quantity, setQuantity] = useState(1);

    // 2. Hook xử lý mua vé
    const { buyVoucher, isLoading } = useBuyVoucher();

    // 3. Hàm mở Modal (Luôn reset số lượng về 1 khi mở lại)
    const handleOpenModal = () => {
        setQuantity(1);
        setIsModalOpen(true);
    };

    // Helper tăng/giảm số lượng
    const handleIncrease = () => setQuantity(prev => prev + 1);
    const handleDecrease = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

    // 4. Hàm xác nhận mua (Gửi số lượng lên API)
    const handleConfirmBuy = async () => {
        await buyVoucher(
            {
                serviceId: item.serviceId,
                amount: quantity // <-- Truyền số lượng user chọn
            },
            item.unitPrice,
            () => {
                setIsModalOpen(false);
            }
        );
        setIsModalOpen(false);
    };

    // Tính tổng tiền hiển thị
    const totalAmount = item.unitPrice * quantity;

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
                            onClick={handleOpenModal}
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

            {/* --- POPUP XÁC NHẬN (CÓ CHỌN SỐ LƯỢNG) --- */}
            <ConfirmModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmBuy}
                title="Xác nhận mua vé"
                isLoading={isLoading}
                message={
                    <div className="flex flex-col items-center gap-4">
                        <span className="text-center text-slate-500">
                            Bạn muốn mua dịch vụ <br/>
                            <strong className="text-indigo-600 dark:text-indigo-400 text-lg">{item.serviceName}</strong>
                        </span>

                        {/* 1. Bộ chọn Số lượng */}
                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-xl border border-slate-100 dark:border-slate-600 my-2">
                            <button
                                onClick={handleDecrease}
                                className="w-9 h-9 flex items-center justify-center bg-white dark:bg-slate-600 rounded-lg shadow-sm border border-slate-200 dark:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-500 transition-colors text-slate-600 dark:text-white active:scale-95"
                            >
                                <Minus size={18} />
                            </button>
                            <span className="font-bold text-2xl w-12 text-center text-slate-800 dark:text-white">{quantity}</span>
                            <button
                                onClick={handleIncrease}
                                className="w-9 h-9 flex items-center justify-center bg-white dark:bg-slate-600 rounded-lg shadow-sm border border-slate-200 dark:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-500 transition-colors text-slate-600 dark:text-white active:scale-95"
                            >
                                <Plus size={18} />
                            </button>
                        </div>

                        {/* 2. Hiển thị Tổng tiền */}
                        <div className="w-full text-sm text-slate-500 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                            <div className="flex justify-between gap-4 mb-2">
                                <span>Đơn giá:</span>
                                <span>{formatCurrency(item.unitPrice)}</span>
                            </div>
                            <div className="flex justify-between gap-4 pt-2 border-t border-indigo-200 dark:border-indigo-700/50">
                                <span className="font-bold text-slate-700 dark:text-slate-300">Tổng thanh toán:</span>
                                <strong className="text-indigo-600 dark:text-indigo-400 text-lg">{formatCurrency(totalAmount)}</strong>
                            </div>
                        </div>
                    </div>
                }
                confirmText="Thanh toán ngay"
            />
        </>
    );
};