import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Filter } from 'lucide-react';
import {ServiceCard} from "@/components/merchant/ServiceCard";
import {ServiceModal} from "@/components/merchant/ServiceModal";
import {ServiceFilter} from "@/components/merchant/ServiceFilter";
import { ServiceItem } from '@/types/merchant.types';

const MerchantServicePage: React.FC = () => {
    // --- STATE ---
    // Khởi tạo mảng rỗng, sau này sẽ gọi API để set lại setItems
    const [items, setItems] = useState<ServiceItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);

    // --- EFFECT: LOAD DATA (Sau này bỏ comment để gọi API) ---
    useEffect(() => {
        // const fetchItems = async () => {
        //     setIsLoading(true);
        //     const data = await merchantService.getServices();
        //     setItems(data);
        //     setIsLoading(false);
        // };
        // fetchItems();
    }, []);

    // --- FILTER LOGIC (Client-side filtering tạm thời) ---
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
            return matchSearch && matchCat;
        });
    }, [items, searchTerm, selectedCategory]);

    // --- HANDLERS ---
    const handleToggleStatus = async (id: number) => {
        // Call API update status...
        // Sau khi success thì update state local
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
        ));
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Bạn có chắc muốn xóa món này không?')) {
            // Call API delete...
            setItems(prev => prev.filter(item => item.id !== id));
        }
    };

    const handleOpenModal = (item?: ServiceItem) => {
        setEditingItem(item || null);
        setIsModalOpen(true);
    };

    const handleSaveItem = async (formData: Partial<ServiceItem>) => {
        // Call API create/update...
        console.log("Saving data:", formData);

        // Mock update state
        if (editingItem) {
            setItems(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...formData } as ServiceItem : item));
        } else {
            // Mock ID generation
            const newItem = { ...formData, id: Date.now(), isAvailable: true, soldCount: 0 } as ServiceItem;
            setItems(prev => [newItem, ...prev]);
        }
        setIsModalOpen(false);
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedCategory('all');
    };

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Quản lý Menu</h1>
                        <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                            {items.length} món ăn
                        </span>
                    </div>
                    <p className="text-slate-500 font-medium">Thêm, sửa, xóa và quản lý tình trạng món ăn.</p>
                </div>

                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-slate-900/20 hover:bg-black transition-transform active:scale-95"
                >
                    <Plus size={20} /> Thêm món mới
                </button>
            </div>

            {/* FILTER BAR */}
            <ServiceFilter
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                onClear={handleClearFilters}
            />

            {/* GRID ITEMS */}
            {isLoading ? (
                <div className="text-center py-20 text-slate-400">Đang tải dữ liệu...</div>
            ) : items.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl">
                    <p className="text-slate-500 font-medium">Chưa có món ăn nào.</p>
                    <button onClick={() => handleOpenModal()} className="text-primary font-bold mt-2 hover:underline">Thêm món ngay</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.map(item => (
                        <ServiceCard
                            key={item.id}
                            item={item}
                            onEdit={handleOpenModal}
                            onDelete={handleDelete}
                            onToggleStatus={handleToggleStatus}
                        />
                    ))}
                </div>
            )}

            {/* MODAL */}
            <ServiceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveItem}
                editingItem={editingItem}
            />
        </div>
    );
};

export default MerchantServicePage;