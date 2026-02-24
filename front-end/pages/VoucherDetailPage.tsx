// src/pages/VoucherDetailPage.tsx

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    Clock,
    Ticket,
    CheckCircle2,
    AlertCircle,
    QrCode,
    Layers,
    Utensils,
    Store,
    MapPin,
    // [THÊM MỚI] Icon cho nút cộng trừ
    Minus,
    Plus
} from 'lucide-react';
import { useVoucherDetail } from '@/hooks/useVoucherDetails';
import { formatCurrency } from '@/utils/format';
import { VoucherQrModal } from '@/components/ui/VoucherQrModal';

const VoucherDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Hook lấy dữ liệu (GIỮ NGUYÊN)
    const { voucher, isLoading, error } = useVoucherDetail(id);
    const [showQrModal, setShowQrModal] = useState(false);
    // [THÊM MỚI] State quản lý số lượng ngay tại trang này
    const [quantity, setQuantity] = useState(1);
    console.log(voucher)
    // --- Loading State (GIỮ NGUYÊN) ---
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">Đang tải chi tiết voucher...</p>
            </div>
        );
    }

    if (error || !voucher) {
        return (
            <div className="p-4 text-center">
                <p className="text-red-500 font-medium">Không thể tải thông tin voucher</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-indigo-600 font-medium">
                    Quay lại
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-10">
            {/* Header (GIỮ NGUYÊN) */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="font-bold text-xl text-slate-800">Chi tiết Voucher</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Cột trái: Ảnh và thông tin chính (GIỮ NGUYÊN LAYOUT) */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="h-64 relative">
                            {/* [ĐÃ SỬA DÒNG NÀY]: Lấy ảnh voucher, nếu null thì lấy ảnh của món đầu tiên trong items */}
                            <img src={voucher.imageUrl || voucher.items?.[0]?.imageUrl} alt={voucher.serviceName} className="w-full h-full object-cover" />

                            <div className="absolute top-4 right-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    voucher.status === 'ACTIVE' ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'
                                } shadow-lg`}>
                                    {voucher.status === 'ACTIVE' ? 'KHẢ DỤNG' : 'ĐÃ SỬ DỤNG'}
                                </span>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded uppercase tracking-wider">
                                    {voucher.categoryName || 'Dịch vụ'}
                                </span>
                                <span className="text-slate-400 text-xs">•</span>
                                <span className="text-slate-500 text-xs font-medium">Mã: {voucher.voucherCode.split('-').pop()}</span>
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 leading-tight mb-4">
                                {voucher.serviceName}
                            </h2>

                            {/* Thông tin loại Combo (GIỮ NGUYÊN) */}
                            <div className={`p-4 rounded-2xl border mb-4 ${
                                voucher.comboType === 'SELECT_ONE'
                                    ? 'bg-orange-50 border-orange-100 text-orange-800'
                                    : 'bg-blue-50 border-blue-100 text-blue-800'
                            }`}>
                                <div className="flex items-center gap-2 mb-1">
                                    {voucher.comboType === 'SELECT_ONE' ? <Layers size={16}/> : <CheckCircle2 size={16}/>}
                                    <span className="font-bold text-sm">
                                        {voucher.comboType === 'SELECT_ONE' ? 'COMBO TỰ CHỌN' : 'COMBO TRỌN GÓI'}
                                    </span>
                                </div>
                                <p className="text-xs opacity-90">
                                    {voucher.comboType === 'SELECT_ONE'
                                        ? `Được chọn tối đa ${voucher.usageLimit || 1} món trong danh sách.`
                                        : 'Bạn được nhận tất cả các món trong danh sách này.'}
                                </p>
                            </div>

                            {/* [THÊM MỚI] BỘ CHỌN SỐ LƯỢNG (CHÈN VÀO TRƯỚC NÚT SỬ DỤNG) */}
                            {voucher.status === 'ACTIVE' && (
                                <div className="mb-4 pt-2 border-t border-slate-100">
                                    <div className="flex justify-between items-end mb-3">
                                        <span className="text-sm font-bold text-slate-700">Số lượng dùng:</span>
                                        <span className="text-[10px] text-slate-400 font-medium">Hiện có: {voucher.quantity}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                            className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 active:scale-95 flex items-center justify-center transition-all"
                                        >
                                            <Minus size={20} />
                                        </button>
                                        <div className="flex-1 h-12 flex items-center justify-center bg-indigo-50 border border-indigo-100 rounded-xl">
                                            <span className="text-xl font-bold text-indigo-600">{quantity}</span>
                                        </div>
                                        <button
                                            onClick={() => setQuantity(q => Math.min(voucher.quantity, q + 1))}
                                            className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 active:scale-95 flex items-center justify-center transition-all"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Nút Sử Dụng (GIỮ NGUYÊN LOGIC, CHỈ CẬP NHẬT GIAO DIỆN NẾU CẦN) */}
                            <button
                                onClick={() => setShowQrModal(true)}
                                disabled={voucher.status !== 'ACTIVE'}
                                className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-slate-200"
                            >
                                <QrCode size={20} />
                                SỬ DỤNG NGAY
                            </button>
                        </div>
                    </div>

                    {/* Thông tin quầy (GIỮ NGUYÊN) */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                        <h4 className="font-bold text-slate-800 text-xs uppercase flex items-center gap-2">
                            <Store size={14} className="text-indigo-500" /> Địa điểm sử dụng
                        </h4>
                        <div className="flex items-start gap-3">
                            <MapPin size={16} className="text-slate-400 mt-1" />
                            <div>
                                <p className="font-bold text-slate-800 text-sm">{voucher.counterName || 'Đang cập nhật...'}</p>
                                <p className="text-xs text-slate-500">{voucher.counterLocation || 'Liên hệ nhân viên để biết vị trí'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cột phải: Chi tiết và Items (GIỮ NGUYÊN TOÀN BỘ) */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Ticket size={20} className="text-indigo-500" /> Thông tin vé
                        </h3>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ngày mua</p>
                                <div className="flex items-center gap-2 text-slate-700">
                                    <Calendar size={16} className="text-slate-400" />
                                    <span className="font-semibold text-sm">{new Date(voucher.createdAt).toLocaleDateString('vi-VN')}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hạn sử dụng</p>
                                <div className="flex items-center gap-2 text-slate-700">
                                    <Clock size={16} className="text-orange-400" />
                                    <span className="font-semibold text-sm">{new Date(voucher.expiresAt).toLocaleDateString('vi-VN')}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Giá thanh toán</p>
                                <p className="font-black text-indigo-600 text-lg">{formatCurrency(voucher.priceAtPurchase)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    {voucher.comboType === 'SELECT_ONE' ? 'Số món được chọn còn lại' : 'Tổng sản phẩm còn lại'}
                                </p>
                                <p className="font-black text-slate-800 text-lg">
                                    {voucher.totalRemainingUsage} {voucher.comboType === 'SELECT_ONE' ? 'lượt chọn' : 'sản phẩm'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Utensils size={20} className="text-indigo-500" /> Danh sách món trong combo
                        </h3>

                        <div className="space-y-4">
                            {voucher.items && voucher.items.map((item, index) => (
                                <div key={index} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors">
                                    <img src={item.imageUrl} alt={item.serviceName} className="w-16 h-16 rounded-xl object-cover" />
                                    <div className="flex-grow">
                                        <h4 className="font-bold text-slate-800">{item.serviceName}</h4>
                                        <p className="text-xs text-slate-500">Giá trị: {formatCurrency(item.allocatedPrice || 0)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Trạng thái</p>
                                        <span className={`px-3 py-1 rounded-lg text-xs font-black ${
                                            item.remainingQuantity > 0 && voucher.totalRemainingUsage > 0
                                                ? 'bg-indigo-50 text-indigo-600'
                                                : 'bg-slate-100 text-slate-400 line-through'
                                        }`}>
                                            {voucher.comboType === 'SELECT_ONE'
                                                ? (item.remainingQuantity > 0 && voucher.totalRemainingUsage > 0 ? 'KHẢ DỤNG' : 'HẾT LƯỢT')
                                                : (item.remainingQuantity > 0 ? `CÒN ${item.remainingQuantity}` : 'HẾT')
                                            }
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <h4 className="font-bold text-blue-700 mb-2 text-xs uppercase flex items-center gap-1">
                            <AlertCircle size={14} /> Lưu ý sử dụng
                        </h4>
                        <ul className="list-disc list-inside text-sm text-blue-600 space-y-1 pl-1">
                            <li>Vui lòng đưa mã QR cho nhân viên thu ngân để quét.</li>
                            <li>Vé có giá trị sử dụng theo số lượng còn lại của từng món.</li>
                            <li>{voucher.comboType === 'SELECT_ONE'
                                ? "Đây là gói chọn món, bạn có thể chọn bất kỳ món nào cho đến khi hết lượt."
                                : "Đây là gói trọn bộ, bạn có thể dùng lẻ từng món bất cứ lúc nào."}</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Modal QR Code (TRUYỀN THÊM initialQuantity) */}
            {voucher && (
                <VoucherQrModal
                    isOpen={showQrModal}
                    onClose={() => setShowQrModal(false)}
                    voucherId={voucher.voucherId}
                    voucherName={voucher.serviceName}
                    unitPrice={voucher.priceAtPurchase}
                    maxQuantity={voucher.quantity}
                    initialQuantity={quantity} // [TRUYỀN SỐ LƯỢNG ĐÃ CHỌN VÀO ĐÂY]
                />
            )}
        </div>
    );
};

export default VoucherDetailPage;