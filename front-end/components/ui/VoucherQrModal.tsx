// src/components/ui/VoucherQrModal.tsx

import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'react-qr-code';
import { X, RefreshCw, Clock, Loader2, AlertTriangle, Download, Minus, Plus, QrCode } from 'lucide-react';
import { useGenerateQr } from '@/hooks/useGenerateQr';
import { formatCurrency } from '@/utils/format';

interface VoucherQrModalProps {
    isOpen: boolean;
    onClose: () => void;
    voucherId: string;
    voucherName: string;
    unitPrice: number;
    maxQuantity: number;
    initialQuantity: number; // [MỚI] Nhận số lượng từ trang chi tiết truyền vào
}

export const VoucherQrModal: React.FC<VoucherQrModalProps> = ({
                                                                  isOpen,
                                                                  onClose,
                                                                  voucherId,
                                                                  voucherName,
                                                                  unitPrice,
                                                                  maxQuantity,
                                                                  initialQuantity
                                                              }) => {
    // Hook xử lý API tạo QR
    const { qrData, isLoading, error, generateQr, resetQr } = useGenerateQr();

    const [timeLeft, setTimeLeft] = useState<string>('--:--');
    const [isExpired, setIsExpired] = useState(false);

    // State số lượng nội bộ của Modal (để có thể chỉnh sửa phút chót)
    const [quantity, setQuantity] = useState(initialQuantity);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const qrRef = useRef<HTMLDivElement>(null);

    // --- 1. ĐỒNG BỘ KHI MỞ MODAL ---
    useEffect(() => {
        if (isOpen) {
            // Khi mở modal, cập nhật ngay số lượng từ trang chi tiết
            setQuantity(initialQuantity);
        } else {
            // Khi đóng, reset lại mọi thứ
            resetQr();
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
    }, [isOpen, initialQuantity, voucherId]);

    // --- 2. LOGIC ĐẾM NGƯỢC (Chỉ chạy khi đã có QR) ---
    useEffect(() => {
        if (qrData?.expiresAt) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsExpired(false);

            const expiresTime = new Date(qrData.expiresAt).getTime();

            intervalRef.current = setInterval(() => {
                const now = new Date().getTime();
                const distance = expiresTime - now;

                if (distance < 0) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    setIsExpired(true);
                    setTimeLeft("00:00");
                } else {
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                    setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
                }
            }, 1000);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [qrData]);

    // --- 3. HÀM XỬ LÝ ---
    const handleGenerate = () => {
        generateQr(voucherId, quantity);
    };

    const handleDownloadQr = () => {
        const svg = qrRef.current?.querySelector("svg");
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width + 40;
                canvas.height = img.height + 40;
                if (ctx) {
                    ctx.fillStyle = "#FFFFFF";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 20, 20);
                    const pngFile = canvas.toDataURL("image/png");
                    const downloadLink = document.createElement("a");
                    downloadLink.download = `QR-${voucherName}-${Date.now()}.png`;
                    downloadLink.href = pngFile;
                    downloadLink.click();
                }
            };
            img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
        }
    };

    if (!isOpen) return null;

    // Check trạng thái: Người dùng đang xem QR hay đang xác nhận
    const hasQr = !!qrData && !isLoading && !error;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-indigo-600 p-6 text-center relative shrink-0">
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
                        <X size={24} />
                    </button>
                    <h3 className="text-white font-bold text-lg mb-1">
                        {hasQr ? "Mã Thanh Toán" : "Xác nhận sử dụng"}
                    </h3>
                    <p className="text-indigo-100 text-sm truncate px-4">{voucherName}</p>
                </div>

                <div className="p-6 flex flex-col items-center overflow-y-auto w-full">

                    {/* --- TRẠNG THÁI 1: CHƯA CÓ QR (XÁC NHẬN SỐ LƯỢNG) --- */}
                    {!hasQr && !isLoading && !error && (
                        <div className="w-full flex flex-col items-center space-y-6 py-4">
                            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2">
                                <QrCode size={40} />
                            </div>

                            <p className="text-center text-slate-600 dark:text-slate-300 text-sm px-4">
                                Bạn đang yêu cầu tạo mã QR để sử dụng dịch vụ. <br/>Xác nhận số lượng vé muốn dùng:
                            </p>

                            {/* Bộ chọn số lượng (Vẫn giữ để confirm lại lần cuối nếu muốn) */}
                            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-600">
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-600 shadow-sm border border-slate-200 dark:border-slate-500 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all text-slate-600 dark:text-white">
                                    <Minus size={18} />
                                </button>
                                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 w-12 text-center">{quantity}</span>
                                <button onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-600 shadow-sm border border-slate-200 dark:border-slate-500 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all text-slate-600 dark:text-white">
                                    <Plus size={18} />
                                </button>
                            </div>

                            <div className="text-center">
                                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Tổng giá trị quy đổi</p>
                                <p className="text-xl font-extrabold text-slate-900 dark:text-white">{formatCurrency(unitPrice * quantity)}</p>
                            </div>

                            <button
                                onClick={handleGenerate}
                                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <QrCode size={20} />
                                Tạo mã QR ngay
                            </button>
                        </div>
                    )}

                    {/* --- TRẠNG THÁI 2: ĐANG TẢI --- */}
                    {isLoading && (
                        <div className="py-10 flex flex-col items-center">
                            <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
                            <p className="text-slate-500 font-medium">Đang khởi tạo mã bảo mật...</p>
                        </div>
                    )}

                    {/* --- TRẠNG THÁI 3: LỖI --- */}
                    {error && (
                        <div className="py-6 flex flex-col items-center text-center px-4 w-full">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle size={32} />
                            </div>
                            <p className="text-red-600 font-medium mb-6">{error}</p>
                            <button onClick={() => resetQr()} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-600 transition-colors">
                                Quay lại
                            </button>
                        </div>
                    )}

                    {/* --- TRẠNG THÁI 4: ĐÃ CÓ QR (HIỂN THỊ) --- */}
                    {hasQr && (
                        <div className="w-full animate-in fade-in zoom-in duration-300">
                            {/* KHUNG QR */}
                            <div ref={qrRef} className="relative bg-white p-4 rounded-2xl border-2 border-dashed border-indigo-100 shadow-inner mb-6 w-full flex justify-center">
                                <div className={`transition-all duration-500 ${isExpired ? "opacity-20 blur-[1px] grayscale" : "opacity-100"}`}>
                                    <QRCode
                                        value={qrData.codeString}
                                        size={200}
                                        viewBox={`0 0 256 256`}
                                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    />
                                </div>

                                {isExpired && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                        <div className="bg-white/90 p-3 rounded-xl shadow-lg text-center border border-slate-200">
                                            <span className="block text-slate-800 font-bold mb-2 text-xs">Hết hạn</span>
                                            <button onClick={handleGenerate} className="bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-2">
                                                <RefreshCw size={14} /> Lấy lại
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Info Section */}
                            <div className="w-full space-y-4">
                                <div className="flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-700/30 p-3 rounded-xl">
                                    <div className={`flex items-center gap-2 font-mono text-xl font-bold tracking-widest ${isExpired ? 'text-red-500' : 'text-indigo-600'}`}>
                                        <Clock size={20} />
                                        <span>{timeLeft}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-[10px] text-slate-400 uppercase font-bold">Số lượng: {quantity}</span>
                                        <span className="text-slate-900 dark:text-white font-bold text-base leading-none">
                                            {formatCurrency((unitPrice * quantity) || 0)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={handleDownloadQr} disabled={isExpired} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                        <Download size={18} /> Tải ảnh
                                    </button>
                                    <button onClick={() => resetQr()} className="flex-1 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
                                        <RefreshCw size={18} /> Tạo mới
                                    </button>
                                </div>

                                <p className="text-center text-[10px] text-slate-400 leading-relaxed px-4 pt-2">
                                    *Mã QR này chỉ có giá trị cho <strong>{quantity}</strong> vé và sẽ hết hạn sau 5 phút.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};