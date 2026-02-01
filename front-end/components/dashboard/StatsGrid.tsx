import React from 'react';
import { WalletCard } from './WalletCard';
import { useAuth } from '@/context/AuthContext';
import { useUserCredit } from '@/hooks/useUserCredit';

interface StatsGridProps {
    onNavigate: (tab: string) => void;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ onNavigate }) => {
    // 1. Lấy thông tin User từ Context
    const { user } = useAuth();

    // 2. Lấy thông tin Ví từ API (dựa trên userId)
    const { creditInfo, isLoading } = useUserCredit(user?.userId);

    // 3. Xử lý hiển thị an toàn
    const balance = creditInfo?.balance || 0;
    const studentName = user?.fullName || '---';
    const studentId = user?.username || '---'; // Giả sử username là mã sinh viên/nhân viên

    return (
        <div className="grid grid-cols-1 gap-6">
            {/* Wallet Card - Hiển thị Full Width trên mobile, giới hạn max-width trên PC */}
            <div className="w-full">
                <div className="relative group h-full">
                    <WalletCard
                        balance={balance}
                        studentName={studentName}
                        studentId={studentId}
                        isLoading={isLoading}
                        onAction={(action) => {
                            if(action === 'send') onNavigate('wallet');   // Chuyển tiền/Thanh toán
                            if(action === 'receive') onNavigate('wallet'); // Nạp tiền (chung tab wallet)
                            if(action === 'history') onNavigate('history'); // Lịch sử
                        }}
                        className="h-full w-full shadow-xl"
                    />
                </div>
            </div>
        </div>
    );
};