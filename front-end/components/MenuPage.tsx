
import React, { useState, useMemo } from 'react';
import { Calendar, ChevronRight, ShoppingBag, Search, Filter, UtensilsCrossed, Coffee, Apple, Pizza } from 'lucide-react';
import { Button } from './ui/Button';

// Định nghĩa các danh mục dịch vụ
const CATEGORIES = [
    { id: 'all', label: 'Tất cả', icon: <UtensilsCrossed size={16} /> },
    { id: 'breakfast', label: 'Bữa sáng', icon: <Coffee size={16} /> },
    { id: 'lunch', label: 'Bữa trưa', icon: <Pizza size={16} /> },
    { id: 'dessert', label: 'Tráng miệng', icon: <Apple size={16} /> },
    { id: 'drink', label: 'Đồ uống', icon: <Filter size={16} /> }, // Dùng icon Filter tạm
];

const MenuPage: React.FC = () => {
    const [activeDay, setActiveDay] = useState('Mon');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const days = [
        { id: 'Mon', label: 'Thứ 2', date: '20/05' },
        { id: 'Tue', label: 'Thứ 3', date: '21/05' },
        { id: 'Wed', label: 'Thứ 4', date: '22/05' },
        { id: 'Thu', label: 'Thứ 5', date: '23/05' },
        { id: 'Fri', label: 'Thứ 6', date: '24/05' },
    ];

    // Dữ liệu mẫu mở rộng
    const menuItems = [
        { id: 1, name: 'Cơm sườn bì chả', cal: '450kcal', price: 35000, img: 'https://picsum.photos/200/200?random=101', categoryId: 'lunch', type: 'Bữa trưa' },
        { id: 2, name: 'Bún bò Huế', cal: '500kcal', price: 35000, img: 'https://picsum.photos/200/200?random=102', categoryId: 'lunch', type: 'Bữa trưa' },
        { id: 3, name: 'Sandwich gà', cal: '250kcal', price: 15000, img: 'https://picsum.photos/200/200?random=103', categoryId: 'breakfast', type: 'Bữa sáng' },
        { id: 4, name: 'Sữa chua trái cây', cal: '120kcal', price: 10000, img: 'https://picsum.photos/200/200?random=104', categoryId: 'dessert', type: 'Tráng miệng' },
        { id: 5, name: 'Bánh mì ốp la', cal: '300kcal', price: 20000, img: 'https://picsum.photos/200/200?random=105', categoryId: 'breakfast', type: 'Bữa sáng' },
        { id: 6, name: 'Nước cam ép', cal: '80kcal', price: 15000, img: 'https://picsum.photos/200/200?random=106', categoryId: 'drink', type: 'Đồ uống' },
        { id: 7, name: 'Cơm gà xối mỡ', cal: '600kcal', price: 40000, img: 'https://picsum.photos/200/200?random=107', categoryId: 'lunch', type: 'Bữa trưa' },
        { id: 8, name: 'Sữa tươi trân châu', cal: '350kcal', price: 25000, img: 'https://picsum.photos/200/200?random=108', categoryId: 'drink', type: 'Đồ uống' },
        { id: 9, name: 'Pizza Mini', cal: '400kcal', price: 25000, img: 'https://picsum.photos/200/200?random=109', categoryId: 'lunch', type: 'Bữa trưa' },
        { id: 10, name: 'Chè hạt sen', cal: '150kcal', price: 12000, img: 'https://picsum.photos/200/200?random=110', categoryId: 'dessert', type: 'Tráng miệng' },
    ];

    // Logic lọc dữ liệu
    const filteredItems = useMemo(() => {
        return menuItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, selectedCategory, menuItems]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Thực đơn & Dịch vụ</h1>
                    <p className="text-slate-500 dark:text-slate-400">Khám phá các món ăn và dịch vụ có sẵn trong trường.</p>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 flex items-center gap-2 shadow-sm">
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <Calendar size={20} className="text-slate-500 dark:text-slate-400" />
                    </button>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 pr-2">Tháng 5, 2024</span>
                </div>
            </div>

            {/* SEARCH BAR & CATEGORY FILTER SECTION */}
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm space-y-5 transition-colors">

                {/* Search Input */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm kiếm món ăn, đồ uống (Ví dụ: Cơm, Phở, Sữa...)"
                        className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Categories Pills */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap border ${
                                selectedCategory === cat.id
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            {cat.icon}
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Day Selector (Contextual context: Menu changes by day, but search searches globally or within day) */}
            <div className="flex flex-col gap-2">
                <h3 className="font-bold text-slate-700 dark:text-slate-300 ml-1">Lịch phục vụ tuần này</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {days.map((day) => (
                        <button
                            key={day.id}
                            onClick={() => setActiveDay(day.id)}
                            className={`flex flex-col items-center justify-center min-w-[80px] p-3 rounded-2xl transition-all border-2 shrink-0 ${
                                activeDay === day.id
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                    : 'border-transparent bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            <span className="text-xs font-medium uppercase tracking-wider opacity-80">{day.label}</span>
                            <span className="text-lg font-bold">{day.date}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-none transition-all group flex flex-col h-full">
                            <div className="relative h-48 overflow-hidden shrink-0">
                                <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <span className={`absolute top-3 left-3 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full ${
                                    item.categoryId === 'lunch' ? 'bg-orange-500/90' :
                                        item.categoryId === 'breakfast' ? 'bg-yellow-500/90' :
                                            item.categoryId === 'drink' ? 'bg-blue-500/90' :
                                                'bg-purple-500/90'
                                }`}>
                          {item.type}
                      </span>
                            </div>
                            <div className="p-5 flex flex-col flex-1">
                                <div className="mb-2">
                                    <h4 className="font-bold text-slate-800 dark:text-white text-lg line-clamp-1" title={item.name}>{item.name}</h4>
                                </div>
                                <p className="text-slate-400 text-sm mb-4 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
                                    {item.cal}
                                </p>

                                <div className="mt-auto flex items-center justify-between">
                                    <span className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">{item.price.toLocaleString('vi-VN')}đ</span>
                                    <button className="w-10 h-10 rounded-full bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none active:scale-90">
                                        <ShoppingBag size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-slate-400">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search size={32} className="text-slate-300 dark:text-slate-500" />
                        </div>
                        <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Không tìm thấy món ăn nào</p>
                        <p className="text-sm">Vui lòng thử từ khóa hoặc danh mục khác.</p>
                        <button
                            onClick={() => {setSearchTerm(''); setSelectedCategory('all');}}
                            className="mt-4 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                        >
                            Xóa bộ lọc
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MenuPage;
