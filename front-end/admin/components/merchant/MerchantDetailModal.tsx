import { FC, useState, useEffect } from 'react';
import { Loader2, Store, MapPin, Layers, Package, X, Edit, Check } from 'lucide-react';
import { useAdminMerchantDetail } from '@/hooks/admin/useAdminMerchantDetail';
import { UserStatus } from '@/types/user.type';
import { CatalogStatus } from '@/types/admin.catalog.type';
import { MerchantItemInfo } from '@/types/admin.merchant.type';

// Components
import { MerchantAssetsList } from './MerchantAssetsList';
import { MerchantServiceForm } from './MerchantServiceForm';
import { MerchantPackageForm } from './MerchantPackageForm';

interface MerchantDetailModalProps {
    merchantId: string;
    onClose: () => void;
}

export const MerchantDetailModal: FC<MerchantDetailModalProps> = ({ merchantId, onClose }) => {
    // Gọi Hook xử lý logic
    const {
        merchant, loading, actionLoading,
        updateCounterInfo, changeServiceStatus, changePackageStatus,
        updateService, updatePackage // Hàm update full info
    } = useAdminMerchantDetail(merchantId);

    // --- LOCAL STATE ---
    const [activeTab, setActiveTab] = useState<'SERVICES' | 'PACKAGES'>('SERVICES');
    const [isEditingCounter, setIsEditingCounter] = useState(false);
    const [counterForm, setCounterForm] = useState({ name: '', location: '' });

    // State quản lý item đang sửa (Service hoặc Package)
    const [editingItem, setEditingItem] = useState<MerchantItemInfo | null>(null);

    // Load info vào form counter
    useEffect(() => {
        if (merchant?.counter) {
            setCounterForm({
                name: merchant.counter.counterName,
                location: merchant.counter.location
            });
        }
    }, [merchant]);

    // Action: Lưu thông tin quầy
    const handleSaveCounter = async () => {
        const success = await updateCounterInfo({
            counterName: counterForm.name,
            location: counterForm.location,
            status: merchant?.counter?.status
        });
        if (success) setIsEditingCounter(false);
    };

    // Action: Đổi status nhanh (Khóa/Mở)
    const handleToggleStatus = (itemId: string, currentStatus: CatalogStatus) => {
        const newStatus = currentStatus === CatalogStatus.ACTIVE ? CatalogStatus.INACTIVE : CatalogStatus.ACTIVE;
        const reason = currentStatus === CatalogStatus.ACTIVE ? "Khóa bởi Admin" : "";

        if (activeTab === 'SERVICES') {
            changeServiceStatus(itemId, newStatus, reason);
        } else {
            changePackageStatus(itemId, newStatus, reason);
        }
    };

    // Render Loading
    if (loading && !merchant) {
        return <div className="flex items-center justify-center h-full text-white"><Loader2 size={32} className="animate-spin text-purple-500" /></div>;
    }

    if (!merchant) return null;

    return (
        <div className="flex flex-col h-full bg-[#1a1a1a] text-white">
            {/* 1. Header */}
            <div className="p-6 border-b border-white/10 flex items-start justify-between shrink-0 bg-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl font-bold border-2 border-white/10 overflow-hidden">
                        {merchant.imageUrl ? <img src={merchant.imageUrl} className="w-full h-full object-cover" alt="Avatar" /> : merchant.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            {merchant.fullName}
                            <span className={`text-xs px-2 py-0.5 rounded border ${merchant.userStatus === UserStatus.ACTIVE ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                                {merchant.userStatus}
                            </span>
                        </h2>
                        <div className="text-white/50 text-sm mt-1 flex flex-col">
                            <span>@{merchant.email}</span>
                            <span>{merchant.phoneNumber}</span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X size={20} /></button>
            </div>

            {/* 2. Counter Info */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                <div className="md:col-span-2 bg-white/5 rounded-xl p-4 border border-white/10 relative group">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-sm font-bold text-white/70 uppercase flex items-center gap-2"><Store size={16} className="text-blue-400" /> Thông tin Quầy hàng</h3>
                        {!isEditingCounter ? (
                            <button onClick={() => setIsEditingCounter(true)} className="p-1.5 hover:bg-white/10 rounded text-blue-400 transition-colors"><Edit size={14} /></button>
                        ) : (
                            <div className="flex gap-2">
                                <button onClick={() => setIsEditingCounter(false)} className="p-1.5 hover:bg-white/10 rounded text-white/50"><X size={14}/></button>
                                <button onClick={handleSaveCounter} disabled={actionLoading} className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white">{actionLoading ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>}</button>
                            </div>
                        )}
                    </div>
                    {merchant.counter ? (
                        isEditingCounter ? (
                            <div className="space-y-3 mt-3 animate-fadeIn">
                                <input value={counterForm.name} onChange={e => setCounterForm({...counterForm, name: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none" placeholder="Tên quầy" />
                                <input value={counterForm.location} onChange={e => setCounterForm({...counterForm, location: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none" placeholder="Địa chỉ" />
                            </div>
                        ) : (
                            <>
                                <div className="text-lg font-semibold text-white">{merchant.counter.counterName}</div>
                                <div className="text-sm text-white/50 flex items-center gap-1 mt-1"><MapPin size={14} /> {merchant.counter.location}</div>
                                <div className="text-xs text-white/30 mt-2 font-mono bg-white/5 inline-block px-2 py-0.5 rounded">CODE: {merchant.counter.counterCode}</div>
                            </>
                        )
                    ) : <div className="text-white/30 italic py-4 text-sm">Chưa thiết lập quầy hàng</div>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 flex flex-col items-center justify-center">
                        <div className="text-2xl font-bold text-purple-400">{merchant.services.length}</div>
                        <div className="text-xs text-purple-200 uppercase mt-1 flex items-center gap-1"><Layers size={12}/> Dịch vụ</div>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex flex-col items-center justify-center">
                        <div className="text-2xl font-bold text-orange-400">{merchant.packages.length}</div>
                        <div className="text-xs text-orange-200 uppercase mt-1 flex items-center gap-1"><Package size={12}/> Gói Combo</div>
                    </div>
                </div>
            </div>

            {/* 3. List Assets */}
            <div className="flex-1 overflow-hidden flex flex-col bg-white/[0.02]">
                <div className="flex border-b border-white/10 px-6">
                    <button onClick={() => setActiveTab('SERVICES')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'SERVICES' ? 'border-purple-500 text-purple-400' : 'border-transparent text-white/50 hover:text-white'}`}>
                        <Layers size={16} /> Dịch vụ
                    </button>
                    <button onClick={() => setActiveTab('PACKAGES')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'PACKAGES' ? 'border-orange-500 text-orange-400' : 'border-transparent text-white/50 hover:text-white'}`}>
                        <Package size={16} /> Gói Combo
                    </button>
                </div>

                <MerchantAssetsList
                    items={activeTab === 'SERVICES' ? merchant.services : merchant.packages}
                    type={activeTab}
                    loading={actionLoading}
                    onToggleStatus={handleToggleStatus}
                    onEdit={(item) => setEditingItem(item)} // Set item để mở form
                />
            </div>

            {/* 4. Forms Modal Layer */}
            {/* Hiển thị Service Form nếu item là SERVICE */}
            {editingItem?.type === 'SERVICE' && (
                <MerchantServiceForm
                    isOpen={!!editingItem}
                    onClose={() => setEditingItem(null)}
                    initialData={editingItem}
                    onSubmit={updateService}
                    isLoading={actionLoading}
                />
            )}

            {/* Hiển thị Package Form nếu item là PACKAGE */}
            {editingItem?.type === 'PACKAGE' && (
                <MerchantPackageForm
                    isOpen={!!editingItem}
                    onClose={() => setEditingItem(null)}
                    initialData={editingItem}
                    onSubmit={updatePackage}
                    availableServices={merchant.services} // Truyền danh sách service để chọn
                    isLoading={actionLoading}
                />
            )}
        </div>
    );
};