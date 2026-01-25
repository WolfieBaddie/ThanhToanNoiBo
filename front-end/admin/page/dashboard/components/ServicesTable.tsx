import type { FC } from 'react';
import { useState } from 'react';
import { useAdminCatalog } from '@/hooks/admin/useAdminCatalog';
import {
    Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
    Package, Layers, Plus, Loader2, LayoutGrid, List as ListIcon
} from 'lucide-react';

const ServicesTable: FC = () => {
    // 1. GỌI HOOK QUẢN LÝ DỮ LIỆU
    const {
        data,
        loading,
        totalItems,
        totalPages,
        filters,
        categories,
        setTabType,
        setPage,
        setSearch,
        setCategoryFilter,
        setStatusFilter,
        refresh
    } = useAdminCatalog();

    // State UI
    const [showFilters, setShowFilters] = useState(false);
    // [EDIT] Đổi default state từ 'grid' sang 'list'
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    // Helper Format
    const formatCurrency = (amount: number = 0) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-6 animate-fadeIn flex flex-col h-full">

            {/* --- HEADER & CONTROLS --- */}
            <div className="flex flex-col gap-6 mb-6">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-2xl font-bold text-white">Services Management</h3>
                        <p className="text-white/60 text-sm mt-1">
                            Quản lý thực đơn và các gói combo ({totalItems} items)
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Add New Button */}
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20">
                            <Plus size={18} />
                            <span className="hidden sm:inline">Add New</span>
                        </button>

                        {/* View Mode Toggles */}
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/70'}`}
                                title="Grid View"
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/70'}`}
                                title="List View"
                            >
                                <ListIcon size={18} />
                            </button>
                        </div>

                        {/* Refresh */}
                        <button
                            onClick={refresh}
                            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center p-1">

                    {/* TABS */}
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                        <button
                            onClick={() => setTabType('SERVICE')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                filters.type === 'SERVICE' ? 'bg-purple-500 text-white shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Layers size={16} />
                            <span>Services</span>
                        </button>
                        <button
                            onClick={() => setTabType('PACKAGE')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                filters.type === 'PACKAGE' ? 'bg-blue-500 text-white shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Package size={16} />
                            <span>Combos</span>
                        </button>
                    </div>

                    {/* SEARCH & FILTERS */}
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <div className="relative group flex-grow lg:flex-grow-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-purple-400 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder={`Search ${filters.type === 'SERVICE' ? 'services' : 'combos'}...`}
                                className="w-full lg:w-64 bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition-all"
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-medium
                  ${filters.categoryId || filters.isActive !== null
                                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-200'
                                    : 'bg-white/5 border-white/10 text-white hover:border-purple-500/50'}`}
                            >
                                <Filter size={16} />
                                <span>Filter</span>
                            </button>

                            {showFilters && (
                                <div className="absolute top-full right-0 mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                                    {filters.type === 'SERVICE' && (
                                        <div className="mb-3">
                                            <div className="text-xs text-white/40 mb-1.5 font-bold uppercase">Category</div>
                                            <select
                                                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-purple-500"
                                                value={filters.categoryId || ''}
                                                onChange={(e) => setCategoryFilter(e.target.value)}
                                            >
                                                <option value="">All Categories</option>
                                                {categories.map(cat => (
                                                    <option key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-xs text-white/40 mb-1.5 font-bold uppercase">Status</div>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-purple-500"
                                            value={filters.isActive === null ? '' : filters.isActive.toString()}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setStatusFilter(val === '' ? null : val === 'true');
                                            }}
                                        >
                                            <option value="">All Status</option>
                                            <option value="true">Active</option>
                                            <option value="false">Hidden</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="relative min-h-[300px] flex-grow">
                {loading && (
                    <div className="absolute inset-0 bg-black/60 z-10 flex flex-col items-center justify-center backdrop-blur-[2px] rounded-xl">
                        <Loader2 className="animate-spin text-purple-500 mb-2" size={32} />
                        <span className="text-white/60 text-sm">Loading catalog...</span>
                    </div>
                )}

                {!loading && data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 border border-dashed border-white/10 rounded-xl text-white/40">
                        <Package size={48} className="mb-3 opacity-50" />
                        <p>No items found matching your criteria.</p>
                    </div>
                ) : (
                    <>
                        {/* --- VIEW MODE: GRID --- */}
                        {viewMode === 'grid' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-fadeIn">
                                {data.map((item: any, index) => {
                                    const isService = filters.type === 'SERVICE';
                                    const name = isService ? item.serviceName : item.packageName;
                                    const code = isService ? item.serviceCode : item.packageCode;
                                    const price = isService ? item.unitPrice : item.price;
                                    const category = isService ? item.categoryName : 'Combo Package';
                                    const isActive = item.isActive;

                                    return (
                                        <div
                                            key={isService ? item.serviceId : item.packageId}
                                            className="group relative rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02] flex flex-col"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-grow pr-2">
                                                    <h4 className="font-bold text-lg text-white line-clamp-1" title={name}>{name}</h4>
                                                    <div className="flex items-center gap-2 mt-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${isService ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-blue-500/10 border-blue-500/20 text-blue-300'}`}>
                                                {isService ? 'Service' : 'Combo'}
                                            </span>
                                                        <span className="text-white/40 text-xs font-mono">{code}</span>
                                                    </div>
                                                </div>
                                                <div className={`p-1.5 rounded-lg border ${isActive ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                                    <div className={`w-2 h-2 rounded-full bg-current ${!isActive && 'opacity-50'}`} />
                                                </div>
                                            </div>
                                            <div className="space-y-3 flex-grow">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-white/50">Category</span>
                                                    <span className="text-white/80">{category || 'Uncategorized'}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-white/50">Price</span>
                                                    <span className="font-bold text-lg text-white tracking-wide">{formatCurrency(price)}</span>
                                                </div>
                                            </div>
                                            <div className="mt-5 pt-4 border-t border-white/10 flex justify-between gap-3">
                                                <button className="flex-1 text-white cursor-pointer px-3 py-1.5 text-sm rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 transition-colors">Edit</button>
                                                <button className={`flex-1 cursor-pointer px-3 py-1.5 text-sm rounded-lg border transition-colors ${isActive ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400' : 'bg-green-500/10 hover:bg-green-500/20 border-green-500/20 text-green-400'}`}>
                                                    {isActive ? 'Hide' : 'Activate'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* --- VIEW MODE: LIST --- */}
                        {viewMode === 'list' && (
                            <div className="overflow-x-auto rounded-xl border border-white/10 animate-fadeIn">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-white/5 text-xs uppercase font-medium text-white/50">
                                    <tr>
                                        <th className="p-4 border-b border-white/10">Item Info</th>
                                        <th className="p-4 border-b border-white/10">Type</th>
                                        <th className="p-4 border-b border-white/10">Category</th>
                                        <th className="p-4 border-b border-white/10">Price</th>
                                        <th className="p-4 border-b border-white/10">Status</th>
                                        <th className="p-4 border-b border-white/10 text-right">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                    {data.map((item: any) => {
                                        const isService = filters.type === 'SERVICE';
                                        const name = isService ? item.serviceName : item.packageName;
                                        const code = isService ? item.serviceCode : item.packageCode;
                                        const price = isService ? item.unitPrice : item.price;
                                        const category = isService ? item.categoryName : 'Combo Package';
                                        const isActive = item.isActive;

                                        return (
                                            <tr key={isService ? item.serviceId : item.packageId} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                                                <td className="p-4">
                                                    <div>
                                                        <div className="font-medium text-white">{name}</div>
                                                        <div className="text-xs text-white/40 font-mono mt-0.5">{code}</div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${isService ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-blue-500/10 border-blue-500/20 text-blue-300'}`}>
                                                {isService ? 'Service' : 'Combo'}
                                            </span>
                                                </td>
                                                <td className="p-4 text-white/70">
                                                    {category || 'Uncategorized'}
                                                </td>
                                                <td className="p-4 font-bold text-white">
                                                    {formatCurrency(price)}
                                                </td>
                                                <td className="p-4">
                                                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium ${isActive ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full bg-current ${!isActive && 'opacity-50'}`} />
                                                        {isActive ? 'Active' : 'Hidden'}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors" title="Edit">
                                                            Edit
                                                        </button>
                                                        <button className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' : 'bg-green-500/10 hover:bg-green-500/20 text-green-400'}`} title={isActive ? 'Hide' : 'Activate'}>
                                                            {isActive ? 'Hide' : 'On'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* --- PAGINATION FOOTER --- */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                    <p className="text-sm text-white/50">
                        Page <span className="font-bold text-white">{filters.page + 1}</span> of <span className="font-bold text-white">{totalPages}</span>
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(Math.max(0, filters.page - 1))}
                            disabled={filters.page === 0 || loading}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum = i;
                                if (totalPages > 5 && filters.page > 2) pageNum = filters.page - 2 + i;
                                if (pageNum >= totalPages) return null;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all
                                ${filters.page === pageNum ? 'bg-purple-600 text-white shadow-lg' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                                    >
                                        {pageNum + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setPage(Math.min(totalPages - 1, filters.page + 1))}
                            disabled={filters.page >= totalPages - 1 || loading}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServicesTable;