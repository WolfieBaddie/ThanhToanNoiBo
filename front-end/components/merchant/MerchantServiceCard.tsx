import React from 'react';
import { Edit, Trash2, ImageOff, ShoppingBag, Power, Lock, CheckCircle2 } from 'lucide-react';
import { ServiceItem } from '@/types/merchant.types';
import { formatCurrency } from '@/utils/format';

interface MerchantServiceCardProps {
    item: ServiceItem;
    onEdit: (item: ServiceItem) => void;
    onDelete?: (id: number | string) => void;
    onToggleStatus?: (id: number | string) => void;
    readOnly?: boolean; // True = Kho hệ thống
    isListView?: boolean; // [MỚI] True = Hiển thị dạng danh sách ngang
}

export const MerchantServiceCard: React.FC<MerchantServiceCardProps> = ({
                                                                            item,
                                                                            onEdit,
                                                                            onDelete,
                                                                            onToggleStatus,
                                                                            readOnly = false,
                                                                            isListView = false
                                                                        }) => {
    // Check xem có phải món hệ thống không (để hiển thị icon Lock nếu đang ở trong Kho của tôi)
    const isSystemItem = !!item.masterServiceCode;
    const hasImage = Boolean(item.image);

    // Style Dynamic dựa trên Mode (System vs My Store)
    const borderColor = readOnly
        ? 'border-indigo-100 dark:border-indigo-900 shadow-indigo-50/50' // Kho Hệ Thống
        : 'border-slate-100 dark:border-slate-700 hover:shadow-slate-200'; // Kho Của Tôi

    const imageBg = readOnly
        ? 'bg-indigo-50 dark:bg-slate-800'
        : 'bg-slate-100 dark:bg-slate-700';

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-3xl border overflow-hidden hover:shadow-xl transition-all group 
            ${borderColor}
            ${isListView ? 'flex flex-row h-32 items-center' : 'flex flex-col h-full'} 
        `}>

            {/* 1. IMAGE SECTION */}
            <div className={`relative overflow-hidden shrink-0 ${imageBg}
                ${isListView ? 'w-32 h-full border-r border-slate-100 dark:border-slate-700' : 'h-48 w-full'}
            `}>
                {hasImage ? (
                    <img
                        src={item.image}
                        alt={item.name}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 
                            ${!item.isAvailable && !readOnly ? 'grayscale opacity-80' : ''}`}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        {readOnly ? (
                            <ShoppingBag size={isListView ? 24 : 32} className="text-indigo-300 mb-2 opacity-50"/>
                        ) : (
                            <ImageOff size={isListView ? 24 : 32} />
                        )}
                        {!isListView && readOnly && <span className="text-[10px] uppercase font-bold text-indigo-300">System Item</span>}
                    </div>
                )}

                {/* Badge Category (Luôn hiện) */}
                <span className={`absolute top-3 left-3 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1 ${
                    readOnly
                        ? 'bg-indigo-600/90 text-white border border-indigo-500'
                        : 'bg-white/80 dark:bg-black/50 border border-white/20 text-slate-700 dark:text-white'
                }`}>
                    {!readOnly && isSystemItem && <Lock size={10} className="text-orange-500" />}
                    {item.category || 'Món ăn'}
                </span>

                {/* Status Badge (Chỉ hiện ở Card View cho đẹp, List View hiện dạng text hoặc icon khác nếu cần) */}
                {!readOnly && !isListView && (
                    <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm border flex items-center gap-1.5 ${
                        item.isAvailable
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                        {item.isAvailable ? 'Đang bán' : 'Tạm ngưng'}
                    </span>
                )}
            </div>

            {/* 2. CONTENT SECTION */}
            <div className={`p-4 flex flex-1 ${isListView ? 'flex-row items-center justify-between gap-6' : 'flex-col'}`}>

                {/* Info Block */}
                <div className={`${isListView ? 'flex-1 min-w-0' : 'mb-2'}`}>
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-800 dark:text-white text-lg line-clamp-1 leading-snug" title={item.name}>
                            {item.name}
                        </h4>

                        {/* Ở List View, Status hiện cạnh tên */}
                        {!readOnly && isListView && (
                            <span className={`w-2.5 h-2.5 rounded-full ${item.isAvailable ? 'bg-emerald-500' : 'bg-slate-300'}`} title={item.isAvailable ? "Đang bán" : "Tạm ngưng"}></span>
                        )}
                    </div>

                    <div className="text-slate-400 text-sm line-clamp-1 min-h-[20px]">
                        <p>{item.description || "Chưa có mô tả chi tiết."}</p>
                    </div>

                    {/* Ở List View, Giá hiện ngay dưới mô tả */}
                    {isListView && (
                        <div className={`mt-1 font-extrabold text-lg ${readOnly ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                            {formatCurrency(item.price)}
                        </div>
                    )}
                </div>

                {/* Footer Block (Price & Actions) */}
                <div className={`flex items-center gap-2 ${isListView ? 'shrink-0' : 'mt-auto justify-between pt-4 border-t border-slate-50 dark:border-slate-700/50'}`}>

                    {/* Price (Chỉ hiện ở Card View, List view đã hiện ở Info Block) */}
                    {!isListView && (
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Đơn giá</span>
                            <span className={`font-extrabold text-lg ${readOnly ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                                {formatCurrency(item.price)}
                            </span>
                        </div>
                    )}

                    {/* Action Buttons Group */}
                    <div className="flex items-center gap-2">
                        {/* Button 1: Toggle Status (Kho của tôi) */}
                        {!readOnly && onToggleStatus && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onToggleStatus(item.id); }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md active:scale-90 ${
                                    item.isAvailable
                                        ? 'bg-white border border-emerald-100 text-emerald-600 hover:bg-emerald-50'
                                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                                title={item.isAvailable ? "Đang bán (Click để tắt)" : "Đang tắt (Click để bật)"}
                            >
                                <Power size={18} />
                            </button>
                        )}

                        {/* Button 2: Main Action (Edit / Register) */}
                        <button
                            onClick={() => onEdit(item)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all shadow-lg active:scale-90 ${
                                readOnly
                                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 ring-2 ring-indigo-100'
                                    : 'bg-slate-900 hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600 shadow-slate-300'
                            }`}
                            title={readOnly ? "Đăng ký bán món này" : "Chỉnh sửa thông tin"}
                        >
                            {readOnly ? <CheckCircle2 size={18} /> : <Edit size={18} />}
                        </button>

                        {/* Button 3: Delete (Kho của tôi) */}
                        {!readOnly && onDelete && (
                            <button
                                onClick={() => onDelete(item.id)}
                                className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-rose-100 text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm active:scale-90"
                                title="Xóa món ăn khỏi menu"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};