import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TransactionHeader } from './TransactionHeader';
import { TransactionSummary } from './TransactionSummary';
import { TransactionInfoList } from './TransactionInfoList';
import { TransactionMetaInfo } from './TransactionMetaInfo';
import { TransactionActions } from './TransactionActions';
import { useTransactionDetail } from '@/hooks/useTransaction'; // Hook bạn đã tạo ở bước trước

export const TransactionDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Gọi Hook lấy dữ liệu thật
    const { detail, loading, error } = useTransactionDetail(id || null);

    const handleBack = () => {
        navigate(-1);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error || !detail) {
        return (
            <div className="text-center p-8">
                <p className="text-red-500">Không tìm thấy giao dịch hoặc có lỗi xảy ra.</p>
                <button onClick={handleBack} className="mt-4 text-indigo-600 hover:underline">Quay lại</button>
            </div>
        );
    }

    // --- LOGIC XỬ LÝ HIỂN THỊ DỰA TRÊN DỮ LIỆU BACKEND ---

    const isPositive = detail.direction === 'IN';

    // Format ngày giờ: "10:30 - 20/05/2026"
    const dateObj = new Date(detail.createdAt);
    const timeStr = `${dateObj.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} - ${dateObj.toLocaleDateString('vi-VN')}`;

    // Mapping trạng thái
    const statusText = detail.status === 'COMPLETED' ? 'Thành công'
        : detail.status === 'PENDING' ? 'Đang xử lý'
            : detail.status === 'FAILED' ? 'Thất bại' : detail.status;

    // Xác định tiêu đề hiển thị
    // Nếu là DEPOSIT: Hiển thị "Nạp tiền vào ví"
    // Nếu là BUY_VOUCHER: Hiển thị tên món ăn (detail.itemName)
    const displayTitle = detail.type === 'DEPOSIT' ? 'Nạp tiền vào ví' : detail.itemName;

    // Xác định mô tả phụ (cho Deposit là description, cho Voucher là category)
    const subTitle = detail.type === 'DEPOSIT' ? detail.description : detail.categoryName;

    return (
        <div className="max-w-2xl mx-auto pb-20">
            <TransactionHeader onBack={handleBack} />

            {/* Main Card */}
            <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden relative mt-6">

                {/* Decorative Top Bar */}
                <div className={`h-2 w-full ${isPositive ? 'bg-emerald-500' : 'bg-slate-900'}`}></div>

                <TransactionSummary
                    amount={detail.amount}
                    direction={detail.direction}
                    status={statusText}
                />

                <div className="p-8 space-y-6">
                    <TransactionInfoList
                        type={detail.type}
                        title={displayTitle}
                        subInfo={subTitle}
                        time={timeStr}
                        // Các trường riêng của Voucher
                        quantity={detail.quantity}
                        priceAtPurchase={detail.priceAtPurchase}
                        itemImage={detail.itemImage}
                    />

                    <div className="h-px bg-slate-100 dark:bg-slate-700 border-t border-dashed"></div>

                    <TransactionMetaInfo
                        refCode={detail.transactionRef}
                        description={detail.description}
                        // API hiện tại chưa trả về balanceAfter ở endpoint detail,
                        // nếu cần bạn phải bổ sung ở backend hoặc tạm ẩn
                    />
                </div>

                <TransactionActions />
            </div>

            <div className="mt-8 text-center">
                <button className="text-slate-400 text-sm hover:text-slate-900 dark:hover:text-white hover:underline transition-colors">
                    Báo cáo vấn đề về giao dịch này?
                </button>
            </div>
        </div>
    );
};

export default TransactionDetailPage;