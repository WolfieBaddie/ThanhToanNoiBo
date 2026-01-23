import React from 'react';
import { Clock, Tag, ShoppingBag, Layers, FileText } from 'lucide-react'; // Thêm icon FileText

interface TransactionInfoListProps {
    type: string; // 'BUY_VOUCHER' | 'DEPOSIT' | ...
    title: string;
    subInfo?: string | null; // Category hoặc Description gốc
    time: string;

    // Optional cho Voucher
    quantity?: number;
    priceAtPurchase?: number;
    itemImage?: string | null;
}

export const TransactionInfoList: React.FC<TransactionInfoListProps> = ({
                                                                            type, title, subInfo, time, quantity, priceAtPurchase, itemImage
                                                                        }) => {

    const isVoucher = type === 'BUY_VOUCHER';

    return (
        <div className="space-y-5">
            {/* 1. Dòng Tiêu đề / Tên Dịch vụ */}
            <div className="flex justify-between items-start">
                <span className="text-slate-500 text-sm font-medium flex items-center gap-2">
                    <Tag size={16} /> {isVoucher ? 'Dịch vụ' : 'Giao dịch'}
                </span>
                <div className="text-right max-w-[65%]">
                    <span className="text-slate-900 dark:text-white font-bold text-lg block leading-tight">
                        {title}
                    </span>
                    {/* Nếu có ảnh món ăn thì hiện ở đây */}
                    {isVoucher && itemImage && (
                        <img
                            src={itemImage}
                            alt={title}
                            className="w-16 h-16 rounded-lg object-cover mt-2 ml-auto shadow-sm border border-slate-100 dark:border-slate-700"
                        />
                    )}
                </div>
            </div>

            {/* --- [MỚI] 2. Dòng Nội dung chi tiết (Chỉ hiện khi Mua Voucher) --- */}
            {isVoucher && (
                <div className="flex justify-between items-start">
                    <span className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-0.5">
                        <FileText size={16} /> Nội dung
                    </span>
                    <span className="text-slate-900 dark:text-white font-medium text-right flex-1 ml-4">
                       {title}
                    </span>
                </div>
            )}
            {/* ------------------------------------------------------------------ */}

            {/* 3. Dòng Chi tiết số lượng (Chỉ hiện nếu là Voucher) */}
            {isVoucher && quantity && quantity > 0 && (
                <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm font-medium flex items-center gap-2">
                        <ShoppingBag size={16} /> Số lượng mua
                    </span>
                    <span className="text-slate-900 dark:text-white font-medium">
                        {quantity} x {priceAtPurchase?.toLocaleString('vi-VN')}đ
                    </span>
                </div>
            )}

            {/* 4. Dòng Danh mục (Voucher) hoặc Mô tả thêm (Deposit) */}
            {subInfo && (
                <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm font-medium flex items-center gap-2">
                        <Layers size={16} /> {isVoucher ? 'Danh mục' : 'Ghi chú'}
                    </span>
                    <span className="text-slate-900 dark:text-white font-medium text-right truncate max-w-[200px]">
                        {subInfo}
                    </span>
                </div>
            )}

            {/* 5. Thời gian */}
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                <span className="text-slate-500 text-sm font-medium flex items-center gap-2">
                    Thời gian
                </span>
                <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold text-sm">
                    <Clock size={16} className="text-slate-400"/>
                    {time}
                </div>
            </div>
        </div>
    );
};