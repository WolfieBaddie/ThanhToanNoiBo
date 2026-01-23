import React from 'react';
import { X, Clock, Receipt, Printer, AlertTriangle, Image as ImageIcon, MapPin, Store } from 'lucide-react';
import { useTransactionDetail, useUserTransactionDetail } from '@/hooks/useTransaction';
import { TransactionPartnerCard } from "@/components/merchant/TransactionPartnerCard";

interface TransactionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionId: string | null;
    isUserView?: boolean; // [MỚI] Flag xác định view của User hay Merchant
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
                                                                                  isOpen, onClose, transactionId, isUserView = false
                                                                              }) => {
    // 1. Chọn Hook dựa trên loại View
    // Nếu là User -> Gọi API /user/transactions/{id} (đã có logic Vé/Tiền)
    // Nếu là Merchant -> Gọi API /transactions/{id} (Logic tài chính gốc)
    const userHook = useUserTransactionDetail(isUserView ? transactionId : null);
    const merchantHook = useTransactionDetail(!isUserView ? transactionId : null);

    const { detail, loading, error } = isUserView ? userHook : merchantHook;

    if (!isOpen) return null;

    // Helper format tiền tệ (Chỉ dùng cho Merchant hoặc fallback)
    const formatCurrency = (val?: number) => val ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val) : '0đ';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="bg-white dark:bg-slate-900 relative z-10 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

                {/* --- HEADER --- */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Receipt size={20} className="text-indigo-600" />
                        {/* Title linh động: User thấy "Đổi quà", Merchant thấy "Chi tiết" */}
                        {isUserView && detail ? (detail as any).title : "Chi tiết giao dịch"}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* --- CONTENT --- */}
                <div className="p-6 overflow-y-auto min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-4">
                            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <p className="text-slate-500 text-sm">Đang tải thông tin...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-40 text-center text-red-500 gap-2">
                            <AlertTriangle size={32} />
                            <p>{error}</p>
                        </div>
                    ) : detail ? (
                        <div className="space-y-6">

                            {/* 1. THÔNG TIN ĐỐI TÁC (Hiển thị cho cả 2) */}
                            {detail.partnerInfo && (
                                <TransactionPartnerCard info={detail.partnerInfo} />
                            )}

                            {/* 2. CHI TIẾT SẢN PHẨM & GIÁ TRỊ (Phân nhánh logic) */}
                            {isUserView ? (
                                // ==========================================
                                // A. GIAO DIỆN USER (App View)
                                // ==========================================
                                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                                    <div className="flex gap-4 relative z-10">
                                        {/* Ảnh sản phẩm */}
                                        <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                            {detail.itemImage ? (
                                                <img src={detail.itemImage} alt="Item" className="w-full h-full object-cover" />
                                            ) : (
                                                <Receipt size={24} className="text-slate-300" />
                                            )}
                                        </div>

                                        {/* Tên & Số lượng */}
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-900 text-lg leading-snug">
                                                {detail.itemName || "Giao dịch hệ thống"}
                                            </h3>
                                            <p className="text-slate-500 text-sm mt-1">
                                                {detail.categoryName} • Số lượng: <strong>x{detail.quantity}</strong>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Dòng tổng kết (Quan trọng nhất với User) */}
                                    <div className="mt-4 pt-4 border-t border-dashed border-slate-200 flex justify-between items-center">
                                        <span className="text-slate-500 font-medium">Tổng thanh toán</span>
                                        {/* Hiển thị amountDisplay từ Backend (-1 Vé / -35.000đ) */}
                                        <span className={`text-xl font-black ${(detail as any).isTicketRedemption ? 'text-orange-600' : 'text-slate-900'}`}>
                                            {(detail as any).amountDisplay}
                                        </span>
                                    </div>

                                    {/* Background Decoration */}
                                    <div className="absolute -right-6 -bottom-6 text-slate-50 opacity-50 pointer-events-none">
                                        <Receipt size={120} />
                                    </div>
                                </div>
                            ) : (
                                // ==========================================
                                // B. GIAO DIỆN MERCHANT (Dashboard View)
                                // ==========================================
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-slate-900 text-base flex-1 pr-4">
                                            {detail.itemName || detail.description}
                                        </h4>
                                        <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-xs font-bold text-slate-500">
                                            x{detail.quantity}
                                        </span>
                                    </div>

                                    <div className="space-y-2 mt-3 pt-3 border-t border-slate-200 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Đơn giá</span>
                                            <span className="font-medium">{formatCurrency(detail.priceAtPurchase)}</span>
                                        </div>
                                        <div className="flex justify-between text-base">
                                            <span className="font-bold text-slate-700">Thành tiền</span>
                                            <span className={`font-bold ${detail.direction === 'IN' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                {formatCurrency(detail.amount)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3. ẢNH XÁC THỰC (Nếu có) */}
                            {detail.evidenceImage && (
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1 pl-1">
                                        <ImageIcon size={14} /> Ảnh xác thực
                                    </p>
                                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                                        <img
                                            src={detail.evidenceImage}
                                            alt="Evidence"
                                            className="w-full h-auto max-h-[250px] object-contain mx-auto"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* 4. META INFO */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Mã tham chiếu</p>
                                    <p className="text-xs font-mono font-bold text-slate-700 truncate" title={detail.transactionRef}>
                                        {detail.transactionRef}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Thời gian</p>
                                    <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                        <Clock size={12} className="text-emerald-500" />
                                        {new Date(detail.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        <span className="text-slate-400 font-normal ml-1">
                                            {new Date(detail.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* 5. TRẠNG THÁI */}
                            <div className="flex justify-center">
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border
                                    ${detail.status === 'COMPLETED'
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                    {detail.status === 'COMPLETED' ? 'Giao dịch thành công' : detail.status}
                                </span>
                            </div>

                        </div>
                    ) : null}
                </div>

                {/* --- FOOTER --- */}
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <button className="w-full py-3 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-white hover:shadow-sm transition-all flex items-center justify-center gap-2">
                        <Printer size={18} /> In hóa đơn
                    </button>
                </div>
            </div>
        </div>
    );
};