import React from 'react';
import { X, Clock, Receipt, AlertTriangle, Image as ImageIcon, Package } from 'lucide-react'; // Bỏ Printer
import { useTransactionDetail, useUserTransactionDetail } from '@/hooks/useTransaction';
import { TransactionPartnerCard } from "@/components/merchant/TransactionPartnerCard";
import { formatCurrency } from '@/utils/format';

interface TransactionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionId: string | null;
    isUserView?: boolean; // True = User App, False = Merchant CMS
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
                                                                                  isOpen, onClose, transactionId, isUserView = false
                                                                              }) => {
    // Hook
    const userHook = useUserTransactionDetail(isUserView ? transactionId : null);
    const merchantHook = useTransactionDetail(!isUserView ? transactionId : null);
    const { detail, loading, error } = isUserView ? userHook : merchantHook;
    console.log(detail);
    const formatVND = (val: number) => val.toLocaleString('vi-VN') + 'đ';

    if (!isOpen) return null;

    // --- LOGIC TITLE CHO USER ---
    const getUserDisplayTitle = (dt: any) => {
        if (dt.type === 'BUY_VOUCHER') return "Mua Gói dịch vụ";
        if (dt.type === 'REDEMPTION') return "Chi tiết đổi vé"; // Sửa title cho hợp ngữ cảnh
        return dt.title || "Chi tiết giao dịch";
    };

    // --- LOGIC HIỂN THỊ TỔNG TIỀN ---
    const renderUserTotalAmount = (dt: any) => {
        if (dt.type === 'BUY_VOUCHER') {
            if (dt.categoryName?.toLowerCase().includes("gói")) {
                return `+${dt.quantity} Gói`;
            }
            return formatCurrency(dt.amount, dt.type);
        }
        if (dt.type === 'DEPOSIT') {
            return `+${formatCurrency(Math.abs(dt.amount), 'DEPOSIT')}`;
        }
        return formatCurrency(dt.amount, dt.type);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="bg-white dark:bg-slate-900 relative z-10 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

                {/* --- HEADER --- */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Receipt size={20} className="text-indigo-600" />
                        {isUserView && detail ? getUserDisplayTitle(detail) : "Chi tiết giao dịch"}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* --- BODY --- */}
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

                            {/* 1. THÔNG TIN ĐỐI TÁC */}
                            {detail.partnerInfo && detail.type !== 'BUY_VOUCHER' && (
                                <TransactionPartnerCard info={detail.partnerInfo} />
                            )}

                            {/* 2. MAIN CARD */}
                            {isUserView ? (
                                // === GIAO DIỆN USER ===
                                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm relative overflow-hidden">

                                    {/* Nội dung chính */}
                                    <div className="relative z-10">
                                        {/* List items (Nếu có) */}
                                        {detail.items && detail.items.length > 0 ? (
                                            <div className="space-y-4">
                                                {/* Header Gói/Combo */}
                                                {(detail.type === 'BUY_VOUCHER' || detail.categoryName?.includes("Gói") || detail.categoryName?.includes("Combo")) && (
                                                    <div className="pb-3 border-b border-slate-100 mb-2">
                                                        <h4 className="font-black text-slate-800 text-lg leading-snug">
                                                            {detail.itemName}
                                                        </h4>
                                                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                            <Package size={12}/> Chi tiết sử dụng:
                                                        </p>
                                                    </div>
                                                )}

                                                {/* List items */}
                                                <div className="space-y-3">
                                                    {detail.items.map((item: any, index: number) => (
                                                        <div key={index} className="flex gap-3 items-start">
                                                            <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                                                {item.itemImage ? (
                                                                    <img src={item.itemImage} alt={item.itemName} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Receipt size={16} className="text-slate-300" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex justify-between items-start">
                                                                    <h5 className="font-bold text-slate-900 text-sm line-clamp-2 pr-2">
                                                                        {item.itemName}
                                                                    </h5>
                                                                    <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                                                                        {/* Ẩn giá lẻ nếu là Redemption để tránh rối */}
                                                                        {detail.type !== 'REDEMPTION' && formatCurrency(item.unitPrice)}
                                                                    </span>
                                                                </div>
                                                                <p className="text-slate-500 text-xs mt-0.5">
                                                                    Số lượng: <strong className="text-slate-700">x{item.quantity}</strong>
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            // Trường hợp Đơn lẻ (Nạp tiền, Thanh toán thường)
                                            <div className="flex gap-4">
                                                <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                                    {detail.itemImage ? (
                                                        <img src={detail.itemImage} alt="Item" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Receipt size={24} className="text-slate-300" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-slate-900 text-lg leading-snug">
                                                        {detail.itemName || detail.description || "Giao dịch hệ thống"}
                                                    </h3>
                                                    <p className="text-slate-500 text-sm mt-1">
                                                        {detail.categoryName}
                                                        {detail.quantity > 1 && <> • SL: <strong>x{detail.quantity}</strong></>}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* HIỂN THỊ BREAKDOWN THUẾ (Ẩn nếu là REDEMPTION) */}
                                        {(detail.type !== 'REDEMPTION' && detail.taxAmount && detail.taxAmount > 0) && (
                                            <div className="mt-4 pt-4 border-t border-dashed border-slate-200 space-y-2">
                                                <div className="flex justify-between text-sm text-slate-500">
                                                    <span>Giá niêm yết</span>
                                                    <span>{formatCurrency(detail.originalAmount || 0)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-slate-500">
                                                    <span>Thuế VAT (10%)</span>
                                                    <span>{formatCurrency(detail.taxAmount)}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Tổng tiền / Vé (Ẩn nếu là REDEMPTION theo yêu cầu) */}
                                        {detail.type !== 'REDEMPTION' && (
                                            <div className={`flex justify-between items-center ${
                                                (detail.taxAmount && detail.taxAmount > 0)
                                                    ? 'mt-2 pt-2 border-t border-slate-100'
                                                    : 'mt-4 pt-4 border-t border-dashed border-slate-200'
                                            }`}>
                                                <span className="text-slate-500 font-medium">Tổng thanh toán</span>
                                                <span className="text-2xl font-black text-right text-slate-900">
                                                    {renderUserTotalAmount(detail)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Decor */}
                                    <div className="absolute -right-6 -bottom-6 text-slate-50 opacity-50 pointer-events-none">
                                        <Receipt size={120} />
                                    </div>
                                </div>
                            ) : (
                                // === GIAO DIỆN MERCHANT (GIỮ NGUYÊN) ===
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                    {detail.items && detail.items.length > 0 ? (
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                                                <span className="text-xs font-bold text-slate-500 uppercase">Chi tiết đơn hàng</span>
                                            </div>
                                            {detail.items.map((item: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-xs font-bold text-slate-600">
                                                            x{item.quantity}
                                                        </span>
                                                        <span className="text-sm font-medium text-slate-700">{item.itemName}</span>
                                                    </div>
                                                    <span className="text-xs text-slate-500 font-medium">{formatVND(item.unitPrice)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-slate-900 text-base flex-1 pr-4">
                                                {detail.itemName || detail.description}
                                            </h4>
                                            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-xs font-bold text-slate-500">
                                                x{detail.quantity}
                                            </span>
                                        </div>
                                    )}

                                    <div className="space-y-2 mt-3 pt-3 border-t border-slate-200 text-sm">
                                        {(detail.taxAmount && detail.taxAmount > 0) && (
                                            <>
                                                <div className="flex justify-between text-slate-500">
                                                    <span>Tiền hàng</span>
                                                    <span>{formatVND(detail.originalAmount || 0)}</span>
                                                </div>
                                                <div className="flex justify-between text-slate-500">
                                                    <span>VAT (10%)</span>
                                                    <span>{formatVND(detail.taxAmount)}</span>
                                                </div>
                                                <div className="my-1 border-b border-slate-100"></div>
                                            </>
                                        )}

                                        <div className="flex justify-between text-base">
                                            <span className="font-bold text-slate-700">Thành tiền</span>
                                            <span className={`font-bold ${detail.direction === 'IN' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                {formatVND(detail.amount)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3. ẢNH XÁC THỰC */}
                            {detail.evidenceImage && (
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1 pl-1">
                                        <ImageIcon size={14} /> Ảnh xác thực
                                    </p>
                                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                                        <img src={detail.evidenceImage} alt="Evidence" className="w-full h-auto max-h-[250px] object-contain mx-auto" />
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
                                    ${detail.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                    {detail.status === 'COMPLETED' ? 'Giao dịch thành công' : detail.status}
                                </span>
                            </div>

                        </div>
                    ) : null}
                </div>

                {/* --- FOOTER: ĐÃ XÓA NÚT IN HÓA ĐƠN --- */}
            </div>
        </div>
    );
};