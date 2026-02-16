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

// [QUAN TRỌNG] Import các trang con mới
import AdminMerchantRequestPage from "@/admin/page/dashboard/components/AdminMerchantRequestPage";
import AdminMerchantTable from "@/admin/page/dashboard/components/AdminMerchantTable";
const AdminDashboard: FC = () => {
    // Mặc định vào dashboard
    const [activeTab, setActiveTab] = useState('dashboard');

    const renderContent = () => {
        switch(activeTab) {
            // 1. Quản lý Users
            case 'users':
                return <UsersTable />;

            // 2. Quản lý Merchant (Mới tích hợp)
            case 'merchants':
                return <AdminMerchantTable />;

            case 'merchant-requests':
                return <AdminMerchantRequestPage />;

            // 3. Quản lý Dịch vụ & Gói (Sidebar gửi id='catalog')
            case 'catalog':
                return <ServicesTable />;

            // 4. Quản lý Giao dịch (Sidebar gửi id='transactions')
            case 'transactions':
                return <OrdersTable />;

            // 5. Dashboard Home (Default)
            case 'dashboard':
            default:
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <StatsGrid />
                        <RevenueChart />
                        <div className="lg:grid-cols-2 gap-6">
                            {/* Hiển thị bảng giao dịch rút gọn ở trang chủ */}
                            <OrdersTable limit={5} />
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="relative min-h-screen bg-black overflow-hidden">
            {/* Background Effect */}
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
                {/* Sidebar điều hướng */}
                <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

                {/* Nội dung chính */}
                <div className="flex-1 overflow-auto custom-scrollbar">
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