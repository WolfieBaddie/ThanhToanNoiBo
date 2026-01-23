import React, { useState, useEffect } from 'react';
import { X, Coins, Wallet, Minus, Plus, Ticket, ArrowRight, Loader2 } from 'lucide-react';
import { useBuyVoucher } from '@/hooks/useBuyVoucher';
import { formatCurrency } from '@/utils/format';

interface ExchangeVoucherModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// [UPDATE]: Danh sách gợi ý theo đơn vị Xu
const PRESET_XU_VALUES = [10, 20, 50, 100, 200, 500];

export const ExchangeVoucherModal: React.FC<ExchangeVoucherModalProps> = ({ isOpen, onClose }) => {
    // [UPDATE]: State lưu giá trị Xu (mặc định 50 Xu)
    const [xuValue, setXuValue] = useState<number>(50);
    const [quantity, setQuantity] = useState<number>(1);

    const { exchangeGenericVoucher, isLoading } = useBuyVoucher();

    // Reset state khi mở modal
    useEffect(() => {
        if (isOpen) {
            setXuValue(50);
            setQuantity(1);
        }
    }, [isOpen]);

    // Xử lý đổi voucher
    const handleConfirm = async () => {
        if (xuValue < 1) {
            alert("Giá trị voucher tối thiểu là 1 Xu");
            return;
        }

        // [QUAN TRỌNG]: Quy đổi Xu -> VNĐ trước khi gửi lên Server (1 Xu = 1000 VNĐ)
        const creditValueInVND = xuValue * 1000;

        await exchangeGenericVoucher(
            {
                creditValue: creditValueInVND,
                quantity: quantity
            },
            () => {
                onClose();
            }
        );
    };

    if (!isOpen) return null;

    // Tính toán tổng tiền (VNĐ) để hiển thị format
    const unitPriceVND = xuValue * 1000;
    const totalPaymentVND = unitPriceVND * quantity;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden transform scale-100 transition-all border border-slate-100 dark:border-slate-800">

                {/* Header */}
                <div className="bg-indigo-600 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20 text-white pointer-events-none select-none">
                        <Coins size={120} />
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="absolute top-4 right-4 z-50 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md"
                    >
                        <X size={20} />
                    </button>

                    <h3 className="text-white font-bold text-2xl mb-1 relative z-10">Đổi Voucher</h3>
                    <p className="text-indigo-100 text-sm relative z-10 font-medium">Dùng Xu đổi lấy voucher sử dụng linh hoạt</p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    {/* 1. Nhập giá trị Voucher (Nhập Xu) */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Wallet size={16} className="text-indigo-500" />
                            Giá trị mỗi Voucher
                        </label>

                        <div className="relative group">
                            <input
                                type="number"
                                value={xuValue || ''}
                                onChange={(e) => setXuValue(Number(e.target.value))}
                                className="w-full pl-4 pr-16 py-4 text-xl font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all group-hover:border-indigo-300"
                                placeholder="0"
                                min={1}
                            />
                            {/* [UPDATE]: Hiển thị Label "Xu" ngay cạnh số nhập vào */}
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg pointer-events-none">
                                Xu
                            </span>
                        </div>

                        {/* Gợi ý giá trị (Xu) */}
                        <div className="grid grid-cols-3 gap-2">
                            {PRESET_XU_VALUES.map((val) => (
                                <button
                                    key={val}
                                    onClick={() => setXuValue(val)}
                                    className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all active:scale-95 ${
                                        xuValue === val
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 dark:shadow-none'
                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {val} Xu
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. Chọn số lượng */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Ticket size={16} className="text-indigo-500" />
                            Số lượng vé
                        </label>

                        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-700 rounded-xl shadow-sm text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-600 active:scale-90 transition-all border border-slate-100 dark:border-slate-600"
                            >
                                <Minus size={20} />
                            </button>

                            <div className="flex flex-col items-center min-w-[60px]">
                                <span className="text-2xl font-extrabold text-slate-800 dark:text-white leading-none">
                                    {quantity}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Vé</span>
                            </div>

                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-700 rounded-xl shadow-sm text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-600 active:scale-90 transition-all border border-slate-100 dark:border-slate-600"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 flex flex-col gap-3">
                        <div className="flex justify-between text-sm text-slate-500 dark:text-indigo-300">
                            <span>Đơn giá:</span>
                            {/* Format Currency vẫn dùng cho Summary để hiển thị đẹp (truyền vào số VNĐ) */}
                            <span className="font-medium">{formatCurrency(unitPriceVND)}</span>
                        </div>
                        <div className="w-full h-px bg-indigo-200/50 dark:bg-indigo-700/30"></div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-700 dark:text-white">Tổng thanh toán:</span>
                            <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                                {formatCurrency(totalPaymentVND)}
                            </span>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading || xuValue <= 0}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" /> Đang xử lý...
                            </>
                        ) : (
                            <>
                                Xác nhận đổi <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>

                </div>
            </div>
        </div>
    );
};