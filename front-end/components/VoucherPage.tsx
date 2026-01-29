import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Clock, ChevronLeft, ChevronRight, ListFilter, ChevronDown, Check } from 'lucide-react';
import { useMyVouchers } from '@/hooks/useMyVoucher';
import { UserVoucherStatusEnum } from '@/types/voucher.type';
import { formatCurrency } from '@/utils/format';
import { ExchangeVoucherButton } from "@/components/voucher/ExchangeVoucherButton";

// Component con: Xử lý hiển thị ảnh (nếu lỗi -> hiện icon)
const VoucherIcon = ({ src, alt }: { src: string | null | undefined, alt: string }) => {
    const [imageError, setImageError] = useState(false);
    if (!src || imageError) {
        return (
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-slate-600 shadow-sm">
                <Ticket size={20} />
            </div>
        );
    }
    return (
        <img
            src={src}
            alt={alt}
            onError={() => setImageError(true)}
            className="w-12 h-12 rounded-2xl object-cover border border-slate-100 dark:border-slate-700 shadow-sm bg-white"
        />
    );
};

const VoucherPage: React.FC = () => {
    const navigate = useNavigate();
    const { vouchers, pagination, isLoading, filters, changePage, filterByStatus, changePageSize } = useMyVouchers();

    // Dropdown state
    const [isSizeOpen, setIsSizeOpen] = useState(false);
    const sizeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sizeRef.current && !sizeRef.current.contains(event.target as Node)) {
                setIsSizeOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Helpers
    const pageSizeOptions = [5, 10, 20, 50];

    const getCardStyle = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-white dark:bg-slate-800 border-indigo-100 dark:border-slate-700 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10';
            case 'USED': return 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-75 grayscale';
            case 'EXPIRED': return 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 opacity-75';
            default: return 'bg-white';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'ACTIVE': return { text: 'Có hiệu lực', color: 'text-emerald-600 bg-emerald-50' };
            case 'USED': return { text: 'Đã sử dụng', color: 'text-slate-500 bg-slate-100' };
            case 'EXPIRED': return { text: 'Hết hạn', color: 'text-red-500 bg-red-50' };
            default: return { text: status, color: 'text-slate-500' };
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6 pb-20">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Kho Voucher</h1>
                    <p className="text-slate-500 font-medium">Quản lý vé ăn và dịch vụ của bạn</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto z-20">
                    <ExchangeVoucherButton className="w-full sm:w-auto justify-center" />

                    {/* Size Selector */}
                    <div className="relative w-full sm:w-48" ref={sizeRef}>
                        <button onClick={() => setIsSizeOpen(!isSizeOpen)} className="w-full flex items-center justify-between pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-indigo-300 transition-all">
                            <span className="absolute left-3 text-slate-400"><ListFilter size={18} /></span>
                            <span>{pagination.size} vé / trang</span>
                            <ChevronDown size={16} className={`text-slate-400 transition-transform ${isSizeOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isSizeOpen && (
                            <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                                {pageSizeOptions.map((size) => (
                                    <div key={size} onClick={() => { changePageSize(size); setIsSizeOpen(false); }} className="flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer hover:bg-slate-50 text-slate-600">
                                        <span>{size} vé / trang</span>
                                        {pagination.size === size && <Check size={16} className="text-indigo-600" />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Status Tabs */}
                    <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                        <button onClick={() => filterByStatus(UserVoucherStatusEnum.ACTIVE)} className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-bold transition-all ${filters.status === UserVoucherStatusEnum.ACTIVE ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Khả dụng</button>
                        <button onClick={() => filterByStatus('')} className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-bold transition-all ${filters.status === '' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Lịch sử</button>
                    </div>
                </div>
            </div>

            {/* List Vouchers */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-100 rounded-[32px] animate-pulse"></div>)}
                </div>
            ) : (
                <>
                    {vouchers.length === 0 && (
                        <div className="text-center py-20 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm"><Ticket size={32} /></div>
                            <h3 className="text-lg font-bold text-slate-700">Chưa có voucher nào</h3>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {vouchers.map((v) => {
                            const statusInfo = getStatusLabel(v.status);
                            const isCombo = v.items && v.items.length > 0;

                            return (
                                <div key={v.voucherId} onClick={() => navigate(`/vouchers/${v.voucherId}`)} className={`relative p-6 rounded-[32px] border shadow-sm flex flex-col justify-between cursor-pointer transition-all ${getCardStyle(v.status)}`}>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-5">
                                            <div className="flex items-center gap-3">
                                                <VoucherIcon src={v.imageUrl} alt={v.serviceName} />
                                                {v.quantity > 1 && <span className="bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-md">x{v.quantity} Gói</span>}
                                            </div>
                                            <div className={`text-xs font-bold px-3 py-1 rounded-full ${statusInfo.color}`}>{statusInfo.text}</div>
                                        </div>

                                        <h3 className="text-xl font-bold text-slate-800 leading-tight line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">{v.serviceName}</h3>
                                        <p className="text-sm text-slate-500 font-medium">Giá trị: <span className="font-bold text-slate-700">{formatCurrency(v.priceAtPurchase)}</span></p>

                                        {/* Hiển thị tóm tắt Combo */}
                                        {isCombo && (
                                            <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
                                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Chi tiết:</p>
                                                <div className="space-y-1">
                                                    {v.items?.slice(0, 2).map((item) => (
                                                        <div key={item.detailId} className="flex justify-between text-xs text-slate-600">
                                                            <span className="truncate pr-2">• {item.serviceName}</span>
                                                            <span className={item.remainingQuantity > 0 ? "font-bold text-emerald-600" : "text-slate-400"}>x{item.remainingQuantity}</span>
                                                        </div>
                                                    ))}
                                                    {(v.items?.length || 0) > 2 && <span className="text-[10px] text-slate-400 italic block mt-1">+ {(v.items?.length || 0) - 2} món khác...</span>}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative z-10 pt-5 mt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                                        <div className="text-xs text-slate-500 font-mono bg-slate-50 px-3 py-1.5 rounded-lg"><span className="opacity-50">#</span>{v.voucherCode}</div>
                                        {v.expiresAt && <div className="flex items-center gap-1 text-xs text-slate-400"><Clock size={14} /><span>{new Date(v.expiresAt).toLocaleDateString('vi-VN')}</span></div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 pt-8">
                            <button onClick={() => changePage(pagination.pageNumber - 1)} disabled={pagination.pageNumber === 0} className="p-3 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-50 bg-white text-slate-600"><ChevronLeft size={20} /></button>
                            <span className="text-sm font-bold text-slate-700">Trang {pagination.pageNumber + 1} / {pagination.totalPages}</span>
                            <button onClick={() => changePage(pagination.pageNumber + 1)} disabled={pagination.pageNumber >= pagination.totalPages - 1} className="p-3 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-50 bg-white text-slate-600"><ChevronRight size={20} /></button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default VoucherPage;