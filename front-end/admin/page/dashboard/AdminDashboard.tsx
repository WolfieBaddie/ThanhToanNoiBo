import type { FC } from 'react';
import { useState } from 'react';

// Components
import UsersTable from "@/admin/page/dashboard/components/UsersTable.tsx";
import ServicesTable from "@/admin/page/dashboard/components/ServicesTable.tsx";
import OrdersTable from "@/admin/page/dashboard/components/OrdersTable.tsx";
import RevenueChart from "@/admin/page/dashboard/components/RevenueChart.tsx";
import { StatsGrid } from "@/admin/page/dashboard/components/StatsGrid.tsx";
import Galaxy from "@/admin/components/background/Galaxy.tsx";
import DashboardHeader from "@/admin/page/dashboard/components/DashboardHeader.tsx";
import Sidebar from "@/admin/page/dashboard/components/Sidebar.tsx";

// [QUAN TRỌNG] Import trang Merchant Request
import AdminMerchantRequestPage from "@/admin/page/dashboard/components/AdminMerchantRequestPage";
const AdminDashboard: FC = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    const renderContent = () => {
        switch(activeTab) {
            case 'users':
                return <UsersTable />;
            case 'services':
                return <ServicesTable />;
            case 'orders':
                return <OrdersTable />;

            // [CẬP NHẬT] Đổi 'analytics' thành 'merchant-requests'
            // Render trang quản lý yêu cầu thay vì biểu đồ cũ
            case 'merchant-requests':
                return <AdminMerchantRequestPage />;

            // Default: Dashboard Home (Giữ nguyên)
            default: return (
                <div className="space-y-6 animate-fadeIn">
                    <StatsGrid />
                    <RevenueChart />
                    <div className="lg:grid-cols-2 gap-6">
                        <OrdersTable limit={5} />
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="relative min-h-screen bg-black overflow-hidden">
            <Galaxy
                starSpeed={0.3}
                density={2}
                hueShift={180}
                speed={0.8}
                glowIntensity={0.15}
                saturation={0.1}
                mouseRepulsion
                repulsionStrength={0.3}
                twinkleIntensity={0.1}
                rotationSpeed={0.05}
                transparent
            />

            <div className="relative z-10 flex h-screen backdrop-blur-xl">
                <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

                <div className="flex-1 overflow-auto">
                    <div className="p-4 md:p-6 space-y-6">
                        <DashboardHeader />
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;