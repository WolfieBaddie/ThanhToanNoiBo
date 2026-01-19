import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'react-qr-code';
import { X, RefreshCw, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { useGenerateQr } from '@/hooks/useGenerateQr'; // Import Hook mới
import { formatCurrency } from '@/utils/format';

interface VoucherQrModalProps {
    isOpen: boolean;
    onClose: () => void;
    voucherId: string;
    voucherName: string;
    unitPrice?: number;
}

export const VoucherQrModal: React.FC<VoucherQrModalProps> = ({
                                                                  isOpen,
                                                                  onClose,
                                                                  voucherId,
                                                                  voucherName,
                                                                  unitPrice
                                                              }) => {
    // Sử dụng Hook
    const { qrData, isLoading, error, generateQr, resetQr } = useGenerateQr();

    const [timeLeft, setTimeLeft] = useState<string>('--:--');
    const [isExpired, setIsExpired] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Effect 1: Sinh mã khi mở Modal
    useEffect(() => {
        if (isOpen && voucherId) {
            generateQr(voucherId);
        } else {
            // Reset khi đóng modal
            resetQr();
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
    }, [isOpen, voucherId, generateQr, resetQr]);

    // Effect 2: Đếm ngược
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

    const handleRetry = () => {
        generateQr(voucherId);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden transform scale-100 transition-all">
                {/* Header */}
                <div className="bg-indigo-600 p-6 text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <h3 className="text-white font-bold text-lg mb-1">Mã Thanh Toán</h3>
                    <p className="text-indigo-100 text-sm truncate px-4">{voucherName}</p>
                </div>

                {/* Body */}
                <div className="p-8 flex flex-col items-center">

                    {/* KHUNG QR */}
                    <div className="relative bg-white p-4 rounded-2xl border-2 border-dashed border-indigo-100 shadow-inner mb-6 w-full flex justify-center min-h-[220px]">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center text-indigo-600">
                                <Loader2 className="animate-spin mb-2" size={40} />
                                <span className="text-xs font-medium">Đang tạo mã...</span>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center text-center px-2">
                                <AlertTriangle className="text-red-500 mb-2" size={32} />
                                <p className="text-red-500 text-sm mb-3">{error}</p>
                                <button onClick={handleRetry} className="text-indigo-600 text-sm font-bold underline">
                                    Thử lại
                                </button>
                            </div>
                        ) : qrData ? (
                            <>
                                <div className={`transition-all duration-500 ${isExpired ? "opacity-10 blur-sm grayscale" : "opacity-100"}`}>
                                    <QRCode
                                        value={qrData.codeString}
                                        size={180}
                                        viewBox={`0 0 256 256`}
                                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    />
                                </div>
                                {isExpired && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 animate-in fade-in zoom-in duration-300">
                                        <div className="bg-white/90 p-4 rounded-xl shadow-lg text-center">
                                            <span className="block text-slate-800 font-bold mb-3 text-sm">Mã đã hết hạn</span>
                                            <button
                                                onClick={handleRetry}
                                                className="bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto"
                                            >
                                                <RefreshCw size={14} /> Lấy mã mới
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : null}
                    </div>

                    {/* Info Section */}
                    {!error && !isLoading && (
                        <div className="w-full space-y-4">
                            <div className={`flex items-center justify-center gap-2 font-mono text-2xl font-bold tracking-widest ${isExpired ? 'text-red-500' : 'text-indigo-600'}`}>
                                <Clock size={24} />
                                <span>{timeLeft}</span>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl flex items-center justify-between border border-slate-100 dark:border-slate-700">
                                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Giá trị sử dụng</span>
                                <span className="text-slate-900 dark:text-white font-bold text-lg">
                                    {formatCurrency(unitPrice || qrData?.creditAmount)}
                                </span>
                            </div>

                            <p className="text-center text-xs text-slate-400 leading-relaxed">
                                Vui lòng đưa mã này cho thiết bị quét để hoàn tất thanh toán.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};