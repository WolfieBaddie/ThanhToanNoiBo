import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // [MỚI]
import { Notification } from './ui/Notification';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { StatsGrid } from './dashboard/StatsGrid';
import { RecentTransactionsTable } from './dashboard/RecentTransactionsTable';
import { SpendingChart } from './dashboard/SpendingChart';
import { QuickActionPanel } from './dashboard/QuickActionsPanel';

// [SỬA] Bỏ onNavigate khỏi props vì App.tsx không truyền vào
interface DashboardPageProps {
    onViewTransaction?: (id: number) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onViewTransaction }) => {
    const navigate = useNavigate(); // [MỚI] Khởi tạo hook điều hướng
    const [notification, setNotification] = useState<{isOpen: boolean, message: string}>({ isOpen: false, message: '' });

    // Hàm wrapper để truyền cho các component con cũ (StatsGrid, RecentTransactionsTable)
    // giúp chúng không bị lỗi khi gọi onNavigate
    const handleNavigate = (path: string) => {
        navigate(path);
    };

    return (
        <div className="space-y-6">
            <Notification
                type="success"
                isOpen={notification.isOpen}
                onClose={() => setNotification({ ...notification, isOpen: false })}
                message={notification.message}
            />

            {/* 1. Header Section */}
            <DashboardHeader onScanClick={() => navigate('/voucher')} />

            {/* 2. Main Grid Layout */}
            <div className="flex flex-col gap-6">

                {/* Row 1: Wallet & Quick Stats */}
                {/* Vẫn truyền handleNavigate nếu StatsGrid cần dùng */}
                <StatsGrid onNavigate={handleNavigate} />

                {/* Row 2: Charts & Actions */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2">
                        <SpendingChart />
                    </div>
                    <div className="xl:col-span-1">
                        {/* QuickActionPanel đã sửa để tự dùng useNavigate, không cần truyền props nữa */}
                        <QuickActionPanel />
                    </div>
                </div>

                {/* Row 3: Transactions */}
                <RecentTransactionsTable onNavigate={handleNavigate} onViewDetail={onViewTransaction} />
            </div>
        </div>
    );
};

export default DashboardPage;