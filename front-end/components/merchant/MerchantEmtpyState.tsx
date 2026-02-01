import React from 'react';
import { Search, PackageOpen } from 'lucide-react';

interface MerchantEmptyStateProps {
    isSystemMode: boolean;
    onClearFilters?: () => void;
    onCreate?: () => void;
}

export const MerchantEmptyState: React.FC<MerchantEmptyStateProps> = ({
                                                                          isSystemMode,
                                                                          onClearFilters,
                                                                          onCreate
                                                                      }) => {
    return (
        <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[32px] bg-slate-50/50 dark:bg-slate-800/30">
            <div className="w-20 h-20 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                {isSystemMode ? (
                    <Search size={40} className="text-slate-300 dark:text-slate-500" />
                ) : (
                    <PackageOpen size={40} className="text-slate-300 dark:text-slate-500" />
                )}
            </div>

            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                {isSystemMode ? 'Không tìm thấy món nào trong hệ thống' : 'Bạn chưa có món ăn nào'}
            </h3>

            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-6">
                {isSystemMode
                    ? 'Thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác.'
                    : 'Hãy tạo món mới hoặc đăng ký bán các món từ hệ thống.'}
            </p>

            <div className="flex gap-4 justify-center">
                {onClearFilters && (
                    <button
                        onClick={onClearFilters}
                        className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        Xóa bộ lọc
                    </button>
                )}

                {!isSystemMode && onCreate && (
                    <button
                        onClick={onCreate}
                        className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-black transition-colors shadow-lg shadow-slate-900/20"
                    >
                        Tạo món mới
                    </button>
                )}
            </div>
        </div>
    );
};