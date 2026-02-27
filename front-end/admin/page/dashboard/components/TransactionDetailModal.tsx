import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom'; // [QUAN TRỌNG] Import Portal
import { X, Clock, Receipt, Printer, AlertTriangle, Image as ImageIcon, Package, User } from 'lucide-react';
import { useTransactionDetail, useUserTransactionDetail } from '@/hooks/useTransaction';
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

    // --- 1. STATE & EFFECT ĐỂ HANDLE SSR/PORTAL ---
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // --- 2. XỬ LÝ KHÓA CUỘN TRANG BODY ---
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // --- HOOKS ---
    const userHook = useUserTransactionDetail(isUserView ? transactionId : null);
    const merchantHook = useTransactionDetail(!isUserView ? transactionId : null);
    const { detail, loading, error } = isUserView ? userHook : merchantHook;
    console.log(detail);
    const formatVND = (val: number) => val.toLocaleString('vi-VN') + 'đ';
    // --- LOGIC HELPER ---
    const getUserDisplayTitle = (dt: any) => {
        if (dt.type === 'BUY_VOUCHER') return "Mua Gói dịch vụ";
        if (dt.type === 'REDEMPTION') return "Sử dụng Voucher";
        return dt.title || "Chi tiết giao dịch";
    };

    const renderUserTotalAmount = (dt: any) => {
        if (dt.type === 'REDEMPTION') {
            const isPackage = dt.categoryName?.toLowerCase().includes("gói") ||
                dt.categoryName?.toLowerCase().includes("combo") ||
                dt.packageId != null;

            if (isPackage && dt.items && dt.items.length > 0) {
                const activeItems = dt.items.filter((i: any) => i.quantity > 0);
                if (activeItems.length === 1) {
                    const item = activeItems[0];
                    return `-${item.quantity} Vé ${item.itemName}`;
                }
                if (activeItems.length > 1) {
                    const maxQty = Math.max(...activeItems.map((i: any) => i.quantity));
                    return `-${maxQty} Vé Combo`;
                }
            }
            return dt.amountDisplay || `-${dt.quantity} Vé`;
        }

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

    // Chỉ render khi đã mounted (client-side) và isOpen = true
    if (!mounted || !isOpen) return null;

    // --- RENDER UI VỚI PORTAL ---
    // createPortal sẽ đưa toàn bộ div này gắn thẳng vào body,
    // giúp position: fixed hoạt động chuẩn xác theo màn hình.
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">

            {/* 1. BACKDROP (Lớp nền tối) */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* 2. MODAL CONTENT (Căn giữa) */}
            <div className="relative z-10 w-full max-w-md bg-[#121212] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">

                {/* HEADER (Cố định, không cuộn) */}
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0 rounded-t-2xl">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Receipt size={20} className="text-purple-400" />
                        {isUserView && detail ? getUserDisplayTitle(detail) : "Chi tiết giao dịch"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* BODY (Cuộn nội dung ở đây) */}
                <div className="p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-4">
                            {/* Spinner chuẩn */}
                            <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                            <p className="text-white/50 text-sm">Đang tải thông tin...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-40 text-center text-red-400 gap-2">
                            <AlertTriangle size={32} />
                            <p>{error}</p>
                        </div>
                    ) : detail ? (
                        <div className="space-y-6">

                            {/* --- PARTNER INFO --- */}
                            {detail.partnerInfo && detail.type !== 'BUY_VOUCHER' && (
                                <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                                        {detail.partnerInfo.partnerName?.charAt(0) || <User size={18}/>}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{detail.partnerInfo.partnerName}</p>
                                        <p className="text-xs text-white/50 truncate">{detail.partnerInfo.subTitle || 'Người dùng'}</p>
                                    </div>
                                </div>
                            )}

                            {/* --- MAIN CARD --- */}
                            {isUserView ? (
                                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-5 relative overflow-hidden shadow-inner shadow-white/5">
                                    <div className="relative z-10">
                                        {/* ITEMS LIST */}
                                        {detail.items && detail.items.length > 0 ? (
                                            <div className="space-y-4">
                                                {(detail.type === 'BUY_VOUCHER' || detail.categoryName?.includes("Gói") || detail.categoryName?.includes("Combo")) && (
                                                    <div className="pb-3 border-b border-white/10 mb-2">
                                                        <h4 className="font-bold text-white text-lg leading-snug">
                                                            {detail.itemName}
                                                        </h4>
                                                        <p className="text-xs text-white/50 mt-1 flex items-center gap-1">
                                                            <Package size={12}/> Chi tiết sử dụng:
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="space-y-3">
                                                    {detail.items.map((item: any, index: number) => (
                                                        <div key={index} className="flex gap-3 items-start">
                                                            <div className="w-12 h-12 rounded-lg bg-black/30 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                                                                {item.itemImage ? (
                                                                    <img src={item.itemImage} alt={item.itemName} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Receipt size={16} className="text-white/30" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex justify-between items-start">
                                                                    <h5 className="font-medium text-white text-sm line-clamp-2 pr-2">
                                                                        {item.itemName}
                                                                    </h5>
                                                                    <span className="text-xs text-white/60 whitespace-nowrap">
                                                                        {formatVND(item.unitPrice)}
                                                                    </span>
                                                                </div>
                                                                <p className="text-white/40 text-xs mt-0.5">
                                                                    Số lượng: <strong className="text-white">x{item.quantity}</strong>
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-4">
                                                <div className="w-14 h-14 rounded-xl bg-black/30 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                                                    {detail.itemImage ? (
                                                        <img src={detail.itemImage} alt="Item" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Receipt size={20} className="text-white/30" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-white text-base leading-snug">
                                                        {detail.itemName || detail.description || "Giao dịch hệ thống"}
                                                    </h3>
                                                    <p className="text-white/50 text-sm mt-1">
                                                        {detail.categoryName}
                                                        {detail.quantity > 1 && <> • SL: <strong className="text-white">x{detail.quantity}</strong></>}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-4 pt-4 border-t border-dashed border-white/20 flex justify-between items-center">
                                            <span className="text-white/60 text-sm font-medium">
                                                {(detail as any).type === 'REDEMPTION' ? 'Tổng sử dụng' : 'Tổng thanh toán'}
                                            </span>
                                            <span className={`text-xl font-bold ${(detail as any).type === 'REDEMPTION' ? 'text-orange-400' : 'text-white'}`}>
                                                {renderUserTotalAmount(detail)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="absolute -right-6 -bottom-6 text-white/5 pointer-events-none">
                                        <Receipt size={120} />
                                    </div>
                                </div>
                            ) : (
                                // ADMIN VIEW
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                    {detail.items && detail.items.length > 0 ? (
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center pb-2 border-b border-white/10">
                                                <span className="text-xs font-bold text-white/40 uppercase">Chi tiết đơn hàng</span>
                                            </div>
                                            {detail.items.map((item: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <span className="bg-white/10 border border-white/5 px-2 py-0.5 rounded text-xs font-bold text-white/80">
                                                            x{item.quantity}
                                                        </span>
                                                        <span className="text-sm text-white/90">{item.itemName}</span>
                                                    </div>
                                                    <span className="text-xs text-white/50 font-mono">{formatVND(item.unitPrice)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-white text-base flex-1 pr-4">
                                                {detail.itemName || detail.description}
                                            </h4>
                                            <span className="bg-white/10 border border-white/5 px-2 py-0.5 rounded text-xs font-bold text-white/80">
                                                x{detail.quantity}
                                            </span>
                                        </div>
                                    )}
                                    <div className="space-y-2 mt-3 pt-3 border-t border-white/10 text-sm">
                                        <div className="flex justify-between text-base">
                                            <span className="font-bold text-white/70">Thành tiền</span>
                                            <span className={`font-bold font-mono text-lg ${
                                                detail.transactionType === 'REDEMPTION' ? 'text-orange-400' :
                                                    (detail.direction === 'IN' || detail.transactionType === 'DEPOSIT' ? 'text-emerald-400' : 'text-white')
                                            }`}>
                                                {formatVND(detail.amount)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- EVIDENCE IMAGE --- */}
                            {detail.evidenceImage && (
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-white/40 uppercase flex items-center gap-1 pl-1">
                                        <ImageIcon size={14} /> Ảnh xác thực
                                    </p>
                                    <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20">
                                        <img src={detail.evidenceImage} alt="Evidence" className="w-full h-auto max-h-[250px] object-contain mx-auto" />
                                    </div>
                                </div>
                            )}

                            {/* --- META INFO --- */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl border border-white/10 bg-white/5">
                                    <p className="text-[10px] text-white/40 font-bold uppercase mb-1">Mã tham chiếu</p>
                                    <p className="text-xs font-mono font-bold text-white truncate" title={detail.transactionRef}>
                                        {detail.transactionRef}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl border border-white/10 bg-white/5">
                                    <p className="text-[10px] text-white/40 font-bold uppercase mb-1">Thời gian</p>
                                    <p className="text-xs font-bold text-white flex items-center gap-1">
                                        <Clock size={12} className="text-purple-400" />
                                        {new Date(detail.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        <span className="text-white/40 font-normal ml-1">
                                            {new Date(detail.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* --- STATUS --- */}
                            <div className="flex justify-center">
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border
                                    ${detail.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    detail.status === 'FAILED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                                    {detail.status === 'COMPLETED' ? 'Giao dịch thành công' : detail.status}
                                </span>
                            </div>

                        </div>
                    ) : null}
                </div>

                {/* FOOTER (Cố định) */}
                <div className="p-4 border-t border-white/10 bg-white/5 shrink-0 rounded-b-2xl">
                    <button className="w-full py-3 rounded-xl border border-white/10 font-bold text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                        <Printer size={18} /> In hóa đơn
                    </button>
                </div>
            </div>
        </div>,
        document.body // Target của Portal
    );
};