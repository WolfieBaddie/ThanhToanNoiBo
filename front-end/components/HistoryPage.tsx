import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, ChevronRight, Search, Calendar, RefreshCw } from 'lucide-react';

// COMPONENTS
import { HistoryHeader } from './history/HistoryHeader';
import { HistoryTable } from './history/HistoryTable';
import { HistoryPagination } from './history/HistoryPagination';
import { TransactionDetailModal } from '@/components/merchant/TransactionDetailModal';
import { DateRangeModal } from "@/components/ui/DateRangeModal";

// HOOKS & TYPES
import { useTransactions } from '@/hooks/useTransaction';

// --- 1. CẬP NHẬT INTERFACE ---
// Thêm trường displayAmount để custom hiển thị (Tiền hoặc Vé)
export interface UiTransaction {
    id: string;
    title: string;      // Tên hiển thị chính (Tên Quán, Tên Người, hoặc Loại GD)
    subTitle?: string;  // Mô tả phụ
    displayDate: string;
    date: string;
    ref: string;
    status: string;
    amount: number;
    type: 'in' | 'out'; // in = cộng (xanh), out = trừ (đỏ)
    image?: string;     // Ảnh đại diện đối tác

    // [MỚI] Chuỗi hiển thị số tiền/vé đã format sẵn (VD: "-1 Vé" hoặc "+50.000đ")
    displayAmount: string;
    isRedemption: boolean; // Flag để UI biết đây là đổi quà
}

const HistoryPage: React.FC = () => {
    // ... (Giữ nguyên các state và hooks)
    const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const {
        data,
        loading,
        totalItems,
        totalPages,
        filters,
        setFilters,
        setPage,
        refetch
    } = useTransactions({ page: 0, size: 10 });

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); };
    const handleDateRangeApply = (from: Date, to: Date) => { /* logic date */ };
    const handleClearFilters = () => { setFilters({ page: 0, size: 10 }); setSearchTerm(''); };
    const handleViewDetail = (id: string) => { setSelectedTxId(id); };

    // --- 2. LOGIC MAPPING DỮ LIỆU (PHẦN QUAN TRỌNG NHẤT) ---
    const uiTransactions: UiTransaction[] = data.map(t => {
        // --- A. XỬ LÝ TIÊU ĐỀ & ẢNH ---
        let displayTitle = "Giao dịch hệ thống";
        let displayImage = undefined;
        let subTitle = t.description;

        // Ưu tiên lấy thông tin từ PartnerInfo (Do Backend trả về)
        if (t.partnerInfo) {
            displayTitle = t.partnerInfo.partnerName; // Tên Quán / Tên Người Chuyển
            displayImage = t.partnerInfo.partnerImage; // Logo / Avatar
        } else {
            // Fallback nếu không có Partner (VD: Nạp tiền hệ thống)
            switch (t.transactionType) {
                case 'DEPOSIT': displayTitle = 'Nạp tiền vào ví'; break;
                case 'WITHDRAW': displayTitle = 'Rút tiền về ngân hàng'; break;
                case 'REFUND': displayTitle = 'Hoàn tiền'; break;
                case 'TRANSFER': displayTitle = 'Chuyển tiền'; break;
                default: displayTitle = 'Giao dịch khác';
            }
        }

        // --- B. XỬ LÝ HIỂN THỊ SỐ TIỀN vs VÉ ---
        const isRedemption = t.transactionType === 'REDEMPTION';
        const isPositive = t.direction === 'IN'; // IN = Cộng tiền/vé, OUT = Trừ

        // Format tiền tệ chuẩn VN
        const currencyStr = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(t.amount);

        let displayAmountStr = currencyStr; // Mặc định là hiển thị tiền

        // [LOGIC ĐỔI QUÀ]: Nếu là Redemption -> Hiển thị số lượng Vé
        if (isRedemption) {
            subTitle = 'Đổi Voucher/Quà tặng';

            // Regex tìm số đầu tiên trong description.
            // VD: "Đổi: 1 Hủ Tiếu..." -> Lấy được số "1"
            const quantityMatch = t.description?.match(/(\d+)/);
            const quantity = quantityMatch ? quantityMatch[0] : '1';

            // Override hiển thị thành Vé
            displayAmountStr = `${quantity} Vé`;
        }
        else if (t.transactionType === 'PAYMENT') {
            subTitle = 'Thanh toán dịch vụ';
        }

        // Ghép dấu (+/-)
        // Nếu là Vé mà direction OUT -> "-1 Vé"
        // Nếu là Tiền mà direction IN -> "+50.000 đ"
        const prefix = isPositive ? '+' : '-';
        const finalDisplayAmount = `${prefix}${displayAmountStr}`;

        return {
            id: t.transactionId,
            title: displayTitle,
            subTitle: subTitle,
            displayDate: new Date(t.createdAt).toLocaleDateString('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            }),
            date: t.createdAt,
            ref: t.transactionRef,
            status: t.status,
            amount: t.amount,
            type: isPositive ? 'in' : 'out',
            image: displayImage,

            // Dữ liệu hiển thị cuối cùng
            displayAmount: finalDisplayAmount,
            isRedemption: isRedemption
        };
    });

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 pb-24 font-sans space-y-6">
            <HistoryHeader />

            {/* Toolbar Area (Giữ nguyên code cũ của bạn) */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                {/* ...Code Toolbar... */}
                <div className="flex-1 w-full"></div> {/* Placeholder */}
                <button onClick={() => refetch()} className="p-2 border rounded-xl"><RefreshCw size={18}/></button>
            </div>

            {/* Table Area */}
            <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden min-h-[400px] relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                )}

                {uiTransactions.length > 0 ? (
                    <>
                        <HistoryTable
                            transactions={uiTransactions}
                            onViewDetail={handleViewDetail}
                        />
                        {/* Pagination Component */}
                    </>
                ) : (
                    !loading && (
                        <div className="text-center py-20 text-slate-500">
                            Không tìm thấy giao dịch nào.
                        </div>
                    )
                )}
            </div>

            {/* Modals */}
            <TransactionDetailModal
                isOpen={!!selectedTxId}
                onClose={() => setSelectedTxId(null)}
                transactionId={selectedTxId}
                isUserView={true}
            />
        </div>
    );
};

export default HistoryPage;