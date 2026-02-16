import React from 'react';
import { MerchantEmptyState } from "@/components/merchant/MerchantEmtpyState";
import { MerchantServiceCard } from './MerchantServiceCard';
import { ServiceItem } from '@/types/merchant.types';
import { Edit, Trash2, PlusCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface MerchantServiceGridProps {
    items: ServiceItem[];
    isLoading: boolean;
    isSystemMode: boolean;
    viewMode: 'list' | 'card';

    // Actions
    onEdit: (item: ServiceItem) => void;
    onDelete: (id: number | string) => void;
    onToggleStatus: (id: number | string) => void;
    onClearFilters?: () => void;
    onOpenCreate?: () => void;
}

export const MerchantServiceGrid: React.FC<MerchantServiceGridProps> = ({
                                                                            items,
                                                                            isLoading,
                                                                            isSystemMode,
                                                                            viewMode,
                                                                            onEdit,
                                                                            onDelete,
                                                                            onToggleStatus,
                                                                            onClearFilters,
                                                                            onOpenCreate
                                                                        }) => {

    // 1. Loading State
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 dark:border-white mb-4"></div>
                <p className="text-sm font-medium">Đang tải dữ liệu...</p>
            </div>
        );
    }

    // 2. Empty State
    if (items.length === 0) {
        return (
            <MerchantEmptyState
                isSystemMode={isSystemMode}
                onClearFilters={onClearFilters}
                onCreate={onOpenCreate}
            />
        );
    }

    // 3. TABLE VIEW (LIST MODE) - Giao diện bảng
    if (viewMode === 'list') {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-300">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4 w-[40%]">Tên dịch vụ</th>
                            <th className="px-6 py-4">Danh mục</th>
                            <th className="px-6 py-4 text-right">Giá bán</th>
                            <th className="px-6 py-4 text-center">Trạng thái</th>
                            <th className="px-6 py-4 text-right">Thao tác</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {items.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                {/* Cột Tên */}
                                <td className="px-6 py-3">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white text-base truncate max-w-[300px]" title={item.name}>
                                            {item.name}
                                        </p>
                                        {item.masterServiceCode && (
                                            <p className="text-xs text-slate-400 font-mono mt-0.5">
                                                #{item.masterServiceCode}
                                            </p>
                                        )}
                                    </div>
                                </td>

                                {/* Cột Danh mục */}
                                <td className="px-6 py-3">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                            {item.category}
                                        </span>
                                </td>

                                {/* Cột Giá */}
                                <td className="px-6 py-3 text-right">
                                        <span className="font-bold text-slate-900 dark:text-white">
                                            {formatCurrency(item.price)}
                                        </span>
                                </td>

                                {/* Cột Trạng thái */}
                                <td className="px-6 py-3 text-center">
                                    <button
                                        onClick={() => !isSystemMode && onToggleStatus(item.id)}
                                        disabled={isSystemMode}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                                            item.isAvailable
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                        } ${isSystemMode ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                                    >
                                        {item.isAvailable ? (
                                            <>
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Đang bán
                                            </>
                                        ) : (
                                            <>
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                Ngừng bán
                                            </>
                                        )}
                                    </button>
                                </td>

                                {/* Cột Thao tác - [ĐÃ SỬA] Hiển thị luôn, không cần hover */}
                                <td className="px-6 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => onEdit(item)}
                                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title={isSystemMode ? "Đăng ký bán" : "Chỉnh sửa"}
                                        >
                                            {isSystemMode ? <PlusCircle size={18} /> : <Edit size={18} />}
                                        </button>

                                        {!isSystemMode && (
                                            <button
                                                onClick={() => onDelete(item.id)}
                                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Xóa"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // 4. CARD VIEW (GRID MODE)
    return (
        <div className="grid gap-6 animate-in fade-in duration-500 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
                <MerchantServiceCard
                    key={item.id}
                    item={item}
                    readOnly={isSystemMode}
                    isListView={false} // Luôn false vì view list đã xử lý riêng ở trên
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleStatus={onToggleStatus}
                />
            ))}
        </div>
    );
};