import React, { useState } from 'react';
import { X, ScanLine, Smartphone, AlertCircle } from 'lucide-react';
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner'; // [MỚI] Import thêm IDetectedBarcode

interface QRScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScanComplete?: (data: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScanComplete }) => {
    const [error, setError] = useState<string | null>(null);

    // [MỚI] Hàm xử lý tương thích với v2
    const handleScan = (detectedCodes: IDetectedBarcode[]) => {
        if (detectedCodes && detectedCodes.length > 0) {
            const rawValue = detectedCodes[0].rawValue; // Lấy giá trị mã QR đầu tiên
            if (rawValue) {
                if (onScanComplete) {
                    onScanComplete(rawValue);
                }
                onClose();
            }
        }
    };

    const handleError = (error: any) => {
        console.error("QR Scan Error:", error);
        // Lỗi thường gặp trên PC không có camera hoặc quyền bị chặn
        setError("Không thể truy cập camera. Vui lòng kiểm tra quyền hoặc kết nối https.");
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">

            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-[110]"
            >
                <X size={24} />
            </button>

            <div className="text-center mb-8 relative z-[110]">
                <h3 className="text-2xl font-bold text-white mb-2">Quét mã QR</h3>
                <p className="text-white/60 text-sm">Di chuyển camera vào vùng mã QR để thanh toán</p>
            </div>

            <div className="relative w-full max-w-sm aspect-square bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">

                <div className="absolute inset-0 z-0">
                    {/* [CẬP NHẬT] Cấu hình mới cho v2 */}
                    <Scanner
                        onScan={handleScan}        // Dùng onScan thay vì onResult
                        onError={handleError}
                        scanDelay={300}            // Đưa ra ngoài làm prop riêng
                        constraints={{             // Đưa ra ngoài làm prop riêng
                            facingMode: 'environment'
                        }}
                        styles={{
                            container: { width: '100%', height: '100%' },
                            video: { width: '100%', height: '100%', objectFit: 'cover' }
                        }}
                        components={{
                            // audio: false,  // Nếu bản v2.1+ lỗi dòng này thì xóa đi, v2.0 vẫn hỗ trợ
                            finder: false  // Tắt khung mặc định
                        }}
                    />
                </div>

                {/* --- GIỮ NGUYÊN GIAO DIỆN CUSTOM CỦA BẠN --- */}
                <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-primary rounded-tl-3xl z-10"></div>
                <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-primary rounded-tr-3xl z-10"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-primary rounded-bl-3xl z-10"></div>
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-primary rounded-br-3xl z-10"></div>

                <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-scan z-20"></div>

                {error && (
                    <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-center p-6 z-30">
                        <AlertCircle size={48} className="text-red-500 mb-4" />
                        <p className="text-white font-medium">{error}</p>
                        <button onClick={onClose} className="mt-4 px-4 py-2 bg-white text-black rounded-lg text-sm font-bold">
                            Đóng
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-8 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-3">
                <ScanLine className="animate-pulse text-primary" size={20} />
                <span className="font-medium text-white">Đang tìm mã QR...</span>
            </div>

            <style>{`
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
        </div>
    );
};