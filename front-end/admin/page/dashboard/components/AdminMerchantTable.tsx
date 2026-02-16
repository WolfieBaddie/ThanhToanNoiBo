import type { FC } from 'react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronLeft, ChevronRight, Loader2, RefreshCw, Store, MapPin, Package, Layers, Eye } from 'lucide-react';
import { useAdminMerchants } from '@/hooks/admin/useAdminMerchant';
import { UserStatus } from '@/types/user.type';
import {MerchantDetailModal} from "@/admin/components/merchant/MerchantDetailModal";

const AdminMerchantTable: FC = () => {
    const {
        data: merchants,
        loading,
        totalItems,
        totalPages,
        filters,
        setPage,
        setSearch,
        refresh
    } = useAdminMerchants(10);

    const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);

    return (
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-6 animate-fadeIn flex flex-col h-full relative">

            {/* Header & Filter */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Store className="text-purple-500" /> Quản lý Đối tác
                    </h3>
                    <p className="text-white/60 text-sm mt-1">Danh sách đối tác và thống kê kinh doanh ({totalItems} bản ghi)</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-purple-400 transition-colors" size={16} />
                        <input type="text" placeholder="Tìm tên, email, quầy..." className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition-all w-64" onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <button onClick={refresh} className="p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors" title="Làm mới"><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
                </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto rounded-xl border border-white/10 flex-grow relative bg-white/[0.02]">
                {loading && <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center backdrop-blur-[2px]"><Loader2 className="animate-spin text-purple-500" size={32} /></div>}
                <table className="w-full border-collapse">
                    <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                        <th className="text-left p-4 text-white/60 font-medium text-sm">Đối tác</th>
                        <th className="text-left p-4 text-white/60 font-medium text-sm">Quầy hàng</th>
                        <th className="text-center p-4 text-white/60 font-medium text-sm">Dịch vụ</th>
                        <th className="text-center p-4 text-white/60 font-medium text-sm">Gói Combo</th>
                        <th className="text-left p-4 text-white/60 font-medium text-sm">Trạng thái</th>
                        <th className="text-right p-4 text-white/60 font-medium text-sm">Hành động</th>
                    </tr>
                    </thead>
                    <tbody>
                    {!loading && merchants.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-16 text-white/40 flex flex-col items-center justify-center"><Store size={40} className="mb-2 opacity-20" /><p>Không tìm thấy đối tác nào phù hợp.</p></td></tr>
                    ) : (
                        merchants.map((m) => (
                            <tr key={m.userId} className="border-b border-white/5 hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setSelectedMerchantId(m.userId)}>
                                <td className="p-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden">
                                            {m.imageUrl ? <img src={m.imageUrl} alt="" className="w-full h-full object-cover"/> : m.fullName.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-white font-medium text-sm group-hover:text-purple-400 transition-colors">{m.fullName}</div>
                                            <div className="text-white/40 text-xs">@{m.username}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col">
                                        <span className="text-white text-sm font-medium flex items-center gap-1.5"><Store size={14} className="text-blue-400"/> {m.counterName}</span>
                                        {m.counterLocation !== '-' && <span className="text-white/40 text-xs flex items-center gap-1 mt-0.5"><MapPin size={12}/> {m.counterLocation}</span>}
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 min-w-[50px] justify-center"><Layers size={14} className="text-purple-400"/><span className="text-white font-bold text-sm">{m.totalServices}</span></div>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 min-w-[50px] justify-center"><Package size={14} className="text-orange-400"/><span className="text-white font-bold text-sm">{m.totalPackages}</span></div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${m.status === UserStatus.ACTIVE ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{m.status}</span>
                                </td>
                                <td className="p-4 text-right">
                                    <button className="p-2 bg-white/5 hover:bg-purple-500/20 hover:text-purple-400 rounded-lg text-white/50 transition-colors"><Eye size={18} /></button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Control */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    <p className="text-sm text-white/50">Trang {filters.page + 1} / {totalPages}</p>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setPage(Math.max(0, filters.page - 1))} disabled={filters.page === 0} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white transition-colors"><ChevronLeft size={18}/></button>
                        <button onClick={() => setPage(Math.min(totalPages - 1, filters.page + 1))} disabled={filters.page >= totalPages - 1} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white transition-colors"><ChevronRight size={18}/></button>
                    </div>
                </div>
            )}

            {/* DETAIL MODAL (Drawer) */}
            {selectedMerchantId && createPortal(
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={() => setSelectedMerchantId(null)} />
                    <div className="relative w-full max-w-4xl bg-[#1a1a1a] h-full shadow-2xl border-l border-white/10 animate-slideInRight overflow-hidden">
                        <MerchantDetailModal merchantId={selectedMerchantId} onClose={() => setSelectedMerchantId(null)} />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default AdminMerchantTable;