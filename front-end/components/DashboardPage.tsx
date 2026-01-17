import React, { useState } from 'react';
import { Wallet, TrendingDown, History, Utensils } from 'lucide-react';
import { QRScannerModal } from './dashboard/QRScannerModal';
import { Notification } from './ui/Notification';

// Import các sub-components
import { DashboardHeader } from './dashboard/DashboardHeader';
import { StatsGrid, StatItem } from './dashboard/StatsGrid';
import { SpendingChart } from './dashboard/SpendingChart';
import { QuickActionsPanel } from './dashboard/QuickActionsPanel';
import { RecentTransactionsTable, Transaction } from './dashboard/RecentTransactionsTable';

interface DashboardPageProps {
    onNavigate: (tab: string) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
    const [showQR, setShowQR] = useState(false);
    const [notification, setNotification] = useState<{isOpen: boolean, message: string}>({ isOpen: false, message: '' });

    // --- Mock Data Section ---
    const stats: StatItem[] = [
        { label: 'Số dư hiện tại', value: '1.250.000đ', change: '+12.5%', isPositive: true, icon: Wallet, colorClass: 'text-brand-primary' },
        { label: 'Chi tiêu tháng', value: '450.000đ', change: '-5.2%', isPositive: false, icon: TrendingDown, colorClass: 'text-orange-500' },
        { label: 'Tổng giao dịch', value: '28', change: '+4', isPositive: true, icon: History, colorClass: 'text-purple-500' },
        { label: 'Điểm tích lũy', value: '350 pts', change: '+12%', isPositive: true, icon: Utensils, colorClass: 'text-emerald-500' },
    ];

    const recentTransactions: Transaction[] = [
        { id: 1, title: 'Nạp tiền Momo', time: '10:30', date: 'Hôm nay', amount: 500000, type: 'in', status: 'Success' },
        { id: 2, title: 'Cơm trưa (C1)', time: '11:45', date: 'Hôm qua', amount: -35000, type: 'out', status: 'Success' },
        { id: 3, title: 'Vinamilk', time: '09:15', date: 'Hôm qua', amount: -12000, type: 'out', status: 'Pending' },
        { id: 4, title: 'Bánh mì', time: '16:00', date: '20/05', amount: -15000, type: 'out', status: 'Success' },
    ];

    const chartData = [40, 70, 45, 90, 65, 85, 30];
    // -------------------------

    const handleQRScanComplete = (data: string) => {
        setShowQR(false);
        setNotification({ isOpen: true, message: 'Thanh toán thành công: -35.000đ' });
    };

    return (
        <div className="min-h-screen bg-dark-bg text-slate-300 p-4 md:p-8 font-sans">
            {/* Functional Layers (Modals, Toasts) */}
            <QRScannerModal
                isOpen={showQR}
                onClose={() => setShowQR(false)}
                onScanComplete={handleQRScanComplete}
            />
            <Notification
                type="success"
                isOpen={notification.isOpen}
                onClose={() => setNotification({ ...notification, isOpen: false })}
                message={notification.message}
            />

            {/* Main Layout */}
            <DashboardHeader
                onNavigate={onNavigate}
                userName="NGUYEN VAN B"
            />

            <StatsGrid stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <SpendingChart data={chartData} />
                <QuickActionsPanel
                    onScanQR={() => setShowQR(true)}
                    onNavigate={onNavigate}
                />
            </div>

            <RecentTransactionsTable
                transactions={recentTransactions}
                onViewAll={() => onNavigate('history')}
            />
        </div>
    );
};

export default DashboardPage;