
import React, { useState } from 'react';
import { QRScannerModal } from './dashboard/QRScannerModal';
import { Notification } from './ui/Notification';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { StatsGrid } from './dashboard/StatsGrid';

import { RecentTransactionsTable } from './dashboard/RecentTransactionsTable';
import { SpendingChart } from './dashboard/SpendingChart';
import { QuickActionPanel } from './dashboard/QuickActionsPanel';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
  onViewTransaction?: (id: number) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onViewTransaction }) => {
  const [showQR, setShowQR] = useState(false);
  const [notification, setNotification] = useState<{isOpen: boolean, message: string}>({ isOpen: false, message: '' });

  const handleQRScanComplete = (data: string) => {
    setShowQR(false);
    setNotification({ isOpen: true, message: 'Thanh toán thành công: -35.000đ' });
  };

  return (
    <div className="space-y-6">
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

      {/* 1. Header Section - Navigate to Voucher instead of opening Scanner */}
      <DashboardHeader onScanClick={() => onNavigate('voucher')} />

      {/* 2. Main Grid Layout */}
      <div className="flex flex-col gap-6">
          
          {/* Row 1: Wallet & Quick Stats */}
          <StatsGrid onNavigate={onNavigate} />

          {/* Row 2: Charts & Actions (Split 2/3 and 1/3) */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                  <SpendingChart />
              </div>
              <div className="xl:col-span-1">
                  <QuickActionPanel onNavigate={onNavigate} />
              </div>
          </div>

          {/* Row 3: Transactions (Full Width) */}
          <RecentTransactionsTable onNavigate={onNavigate} onViewDetail={onViewTransaction} />
      </div>
    </div>
  );
};

export default DashboardPage;
