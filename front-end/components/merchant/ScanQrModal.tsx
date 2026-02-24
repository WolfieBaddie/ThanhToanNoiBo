import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    X, Camera, Image as ImageIcon, QrCode, Loader2, AlertTriangle
} from 'lucide-react';
import jsQR from 'jsqr'; // [MỚI] Import thư viện đọc QR
import { qrService } from '@/services/qr.service';

interface ScanQrModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ScanQrModal: React.FC<ScanQrModalProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // --- HÀM HELPER: ĐỌC QR TỪ FILE ẢNH ---
// --- HÀM HELPER: ĐỌC QR TỪ FILE ẢNH (ĐÃ FIX LỖI MOBILE) ---
    const scanQrFromImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                const image = new Image();
                image.onload = () => {
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d', { willReadFrequently: true }); // Tối ưu cho việc đọc pixel liên tục

                    if (!context) {
                        reject("Không thể khởi tạo bộ xử lý ảnh.");
                        return;
                    }

                    // [FIX MOBILE] Resize ảnh xuống kích thước vừa phải (max 800px)
                    // Mobile chụp ảnh rất to (4K), nếu đưa nguyên vào jsQR sẽ bị nhiễu và văng lỗi.
                    const MAX_SIZE = 800;
                    let width = image.width;
                    let height = image.height;

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // Vẽ ảnh đã được thu nhỏ lên canvas
                    context.drawImage(image, 0, 0, width, height);

                    try {
                        // Lấy dữ liệu Pixel
                        const imageData = context.getImageData(0, 0, width, height);

                        // Gọi jsQR để giải mã
                        const code = jsQR(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: "dontInvert", // Giúp quét nhanh hơn trên mobile
                        });

                        if (code) {
                            resolve(code.data); // Trả về chuỗi text
                        } else {
                            // Cứu cánh lần 2: Đôi khi ảnh bị bóng, bảo jsQR thử đảo ngược màu (invert)
                            const invertedCode = jsQR(imageData.data, imageData.width, imageData.height, {
                                inversionAttempts: "attemptBoth",
                            });
                            if (invertedCode) {
                                resolve(invertedCode.data);
                            } else {
                                reject("Không tìm thấy mã QR hợp lệ. Hãy thử chụp lại rõ nét hơn.");
                            }
                        }
                    } catch (e) {
                        console.error("Lỗi xử lý Canvas:", e);
                        reject("Lỗi trong quá trình phân tích ảnh.");
                    }
                };

                image.onerror = () => reject("File ảnh bị lỗi hoặc không hỗ trợ.");
                image.src = event.target?.result as string;
            };

            reader.onerror = () => reject("Không thể đọc file ảnh này.");
            reader.readAsDataURL(file);
        });
    };

    // --- XỬ LÝ CHÍNH ---
    const handleFile = async (file: File) => {
        setIsProcessing(true);
        setErrorMsg(null);

        try {
            console.log("📷 Đang phân tích ảnh:", file.name);

            // BƯỚC 1: Giải mã ảnh sang text bằng jsQR
            const scannedCodeString = await scanQrFromImage(file);
            console.log("🔍 Đã đọc được mã:", scannedCodeString);

            // BƯỚC 2: Gọi Backend để Verify mã vừa đọc được
            const qrData = await qrService.verifyQr(scannedCodeString);
            console.log("✅ Kết quả API Verify:", qrData);

            // BƯỚC 3: Thành công -> Chuyển trang
            onClose();
            navigate(`/merchant/verify?code=${scannedCodeString}`, { state: { qrData } });

        } catch (error: any) {
            console.error("❌ Lỗi xử lý:", error);

            // Xử lý thông báo lỗi user-friendly
            let message = "Đã xảy ra lỗi.";

            if (typeof error === 'string') {
                message = error; // Lỗi từ hàm scanQrFromImage
            } else if (error.response?.data?.message) {
                message = error.response.data.message; // Lỗi từ Backend (VD: Mã hết hạn)
            } else {
                message = "Không thể xác thực mã QR này.";
            }

            setErrorMsg(message);
        } finally {
            setIsProcessing(false);
        }
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
            // Reset input value để cho phép chọn lại cùng 1 file nếu muốn
            e.target.value = '';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={!isProcessing ? onClose : undefined}
            />

            {/* Modal Content */}
            <div className="bg-white relative z-10 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">

                {/* Header */}
                <div className="p-6 pb-2 flex justify-between items-center bg-white">
                    <div>
                        <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                            <QrCode className="text-indigo-600" strokeWidth={2.5} />
                            Quét mã QR
                        </h3>
                        <p className="text-sm text-slate-500 font-medium mt-1">Chụp ảnh hoặc tải ảnh chứa mã QR</p>
                    </div>
                    {!isProcessing && (
                        <button
                            onClick={onClose}
                            className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="p-6 pt-4 space-y-6 bg-white">

                    {/* Error Alert */}
                    {errorMsg && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium flex items-start gap-3 animate-in slide-in-from-top-2 border border-red-100">
                            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Scanner Box Visual */}
                    <div className={`relative w-full aspect-square bg-slate-50 rounded-3xl border-2 overflow-hidden flex flex-col items-center justify-center group transition-colors ${errorMsg ? 'border-red-200 bg-red-50/10' : 'border-dashed border-slate-200'}`}>

                        {isProcessing ? (
                            <div className="flex flex-col items-center gap-4 animate-pulse">
                                <div className="p-4 bg-white rounded-full shadow-lg shadow-indigo-100">
                                    <Loader2 size={40} className="animate-spin text-indigo-600" />
                                </div>
                                <span className="text-sm font-bold text-slate-600">Đang xử lý ảnh...</span>
                            </div>
                        ) : (
                            <>
                                {/* Khung ngắm */}
                                <div className="absolute inset-0 pointer-events-none p-10">
                                    <div className="w-full h-full border-2 border-slate-300/50 rounded-3xl relative">
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-2xl"></div>
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-2xl"></div>
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-2xl"></div>
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-2xl"></div>
                                    </div>
                                </div>

                                {/* Scan Line Animation */}
                                <div className="w-64 h-64 relative overflow-hidden opacity-50">
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_20px_rgba(99,102,241,0.6)] animate-[scan_2.5s_infinite]"></div>
                                </div>

                                <p className="absolute bottom-8 text-xs font-bold text-slate-400 uppercase tracking-wider">Khu vực nhận diện</p>
                            </>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <label className={`flex flex-col items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 active:scale-95 p-4 rounded-2xl cursor-pointer transition-all border border-indigo-100 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-indigo-600">
                                <Camera size={20} />
                            </div>
                            <span className="font-bold text-sm text-indigo-900">Chụp ảnh</span>

                            {/* Input hỗ trợ Camera trên Mobile */}
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={onFileChange}
                                disabled={isProcessing}
                            />
                        </label>

                        <label className={`flex flex-col items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 active:scale-95 p-4 rounded-2xl cursor-pointer transition-all border border-slate-100 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-600">
                                <ImageIcon size={20} />
                            </div>
                            <span className="font-bold text-sm text-slate-700">Thư viện</span>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={onFileChange}
                                disabled={isProcessing}
                            />
                        </label>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </div>
    );
};