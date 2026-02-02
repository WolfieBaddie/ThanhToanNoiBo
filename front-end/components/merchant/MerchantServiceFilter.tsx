import React, { useState, useRef, useEffect } from 'react';
import { Search, X, FilterX, Store, Globe, ChevronDown, Check } from 'lucide-react';
import { ServiceCategory } from '@/types/catalog.type';

interface MerchantServiceFilterProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;

    selectedCategory: string;
    setSelectedCategory: (catId: string) => void;
    categories: ServiceCategory[];

    isSystemMode: boolean;
    onToggleSystemMode: (isSystem: boolean) => void;

    onClear: () => void;
}

export const MerchantServiceFilter: React.FC<MerchantServiceFilterProps> = ({
                                                                                searchTerm,
                                                                                setSearchTerm,
                                                                                selectedCategory,
                                                                                setSelectedCategory,
                                                                                categories,
                                                                                isSystemMode,
                                                                                onToggleSystemMode,
                                                                                onClear,
                                                                            }) => {
    // State để bật/tắt menu dropdown custom
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Logic click outside để đóng dropdown (nếu cần)
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectMode = (mode: boolean) => {
        onToggleSystemMode(mode);
        setIsDropdownOpen(false);
    };

    const isFiltering = searchTerm.trim() !== '' || selectedCategory !== '' || isSystemMode === true;

    return (
        // CONTAINER BAO TRỌN
        <div className="bg-white dark:bg-slate-800 p-5 rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">

            {/* --- DÒNG 1: SEARCH & CUSTOM DROPDOWN --- */}
            <div className="flex flex-col md:flex-row gap-3 z-20 relative">

                {/* 1. CUSTOM DROPDOWN SOURCE */}
                <div className="relative min-w-[240px]" ref={dropdownRef}>
                    {/* Trigger Button */}
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`w-full flex items-center justify-between px-4 py-3 border rounded-xl text-sm font-bold transition-all ${
                            isDropdownOpen
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-4 ring-indigo-500/10 dark:bg-slate-700 dark:border-indigo-400 dark:text-indigo-300'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            {isSystemMode
                                ? <Globe className="text-indigo-500" size={20} />
                                : <Store className="text-emerald-500" size={20} />
                            }
                            <span>{isSystemMode ? 'Kho hệ thống' : 'Kho của tôi'}</span>
                        </div>
                        <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {/* Dropdown Menu (Popover) */}
                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">

                            {/* Option 1: Kho của tôi */}
                            <button
                                onClick={() => handleSelectMode(false)}
                                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${
                                    !isSystemMode ? 'bg-slate-50 text-slate-900 dark:bg-slate-700/50 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                        <Store size={16} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold">Kho của tôi</div>
                                        <div className="text-[10px] text-slate-400 font-normal">Quản lý món ăn của bạn</div>
                                    </div>
                                </div>
                                {!isSystemMode && <Check size={16} className="text-emerald-500" />}
                            </button>

                            <div className="h-[1px] bg-slate-100 dark:bg-slate-700 mx-4"></div>

                            {/* Option 2: Kho hệ thống */}
                            <button
                                onClick={() => handleSelectMode(true)}
                                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${
                                    isSystemMode ? 'bg-slate-50 text-slate-900 dark:bg-slate-700/50 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                        <Globe size={16} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold">Kho hệ thống</div>
                                        <div className="text-[10px] text-slate-400 font-normal">Đăng ký món từ hệ thống</div>
                                    </div>
                                </div>
                                {isSystemMode && <Check size={16} className="text-indigo-500" />}
                            </button>
                        </div>
                    )}
                </div>

                {/* 2. SEARCH BOX */}
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder={isSystemMode ? "Tìm kiếm món trong hệ thống..." : "Tìm tên món ăn, giá bán..."}
                        className="block w-full pl-11 pr-10 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all h-[46px]" // h-46px để khớp height với dropdown
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* 3. BUTTON CLEAR FILTER */}
                {isFiltering && (
                    <button
                        onClick={onClear}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-bold transition-all border border-red-100 whitespace-nowrap active:scale-95 h-[46px]"
                        title="Xóa tất cả bộ lọc"
                    >
                        <FilterX size={18} />
                        <span className="hidden lg:inline">Xóa lọc</span>
                    </button>
                )}
            </div>

            {/* --- DÒNG 2: DANH MỤC (Nằm gọn bên trong Container) --- */}
            <div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
                    <button
                        onClick={() => setSelectedCategory('')}
                        className={`snap-start flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                            selectedCategory === ''
                                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 shadow-md shadow-slate-900/20'
                                : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'
                        }`}
                    >
                        Tất cả
                    </button>

                    {/* Divider trang trí */}
                    <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-1 flex-shrink-0 self-center"></div>

                    {categories.map((cat) => (
                        <button
                            key={cat.categoryId}
                            onClick={() => setSelectedCategory(cat.categoryId)}
                            className={`snap-start flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                                selectedCategory === cat.categoryId
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800'
                                    : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'
                            }`}
                        >
                            {cat.categoryName}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};