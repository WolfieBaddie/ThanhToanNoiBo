
import React, { useState, useMemo } from 'react';
import { UtensilsCrossed, Coffee, Apple, Pizza, Filter } from 'lucide-react';
import { MenuHeader } from './menu/MenuHeader';
import { MenuFilter } from './menu/MenuFilter';
import { DaySelector } from './menu/DaySelector';
import { MenuGrid } from './menu/MenuGrid';
import { Category, Day, MenuItem } from './menu/types';

// Constants
const CATEGORIES: Category[] = [
  { id: 'all', label: 'Tất cả', icon: <UtensilsCrossed size={16} /> },
  { id: 'breakfast', label: 'Bữa sáng', icon: <Coffee size={16} /> },
  { id: 'lunch', label: 'Bữa trưa', icon: <Pizza size={16} /> },
  { id: 'dessert', label: 'Tráng miệng', icon: <Apple size={16} /> },
  { id: 'drink', label: 'Đồ uống', icon: <Filter size={16} /> },
];

const DAYS: Day[] = [
  { id: 'Mon', label: 'Thứ 2', date: '20/05' },
  { id: 'Tue', label: 'Thứ 3', date: '21/05' },
  { id: 'Wed', label: 'Thứ 4', date: '22/05' },
  { id: 'Thu', label: 'Thứ 5', date: '23/05' },
  { id: 'Fri', label: 'Thứ 6', date: '24/05' },
];

const MENU_ITEMS: MenuItem[] = [
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

const MenuPage: React.FC = () => {
  const [activeDay, setActiveDay] = useState('Mon');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Logic lọc dữ liệu
  const filteredItems = useMemo(() => {
    return MENU_ITEMS.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
  };

  return (
    <div className="space-y-6">
      <MenuHeader />

      <MenuFilter 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={CATEGORIES}
      />

      <DaySelector 
        activeDay={activeDay}
        onDayChange={setActiveDay}
        days={DAYS}
      />

      <MenuGrid 
        items={filteredItems} 
        onClearFilters={handleClearFilters} 
      />
    </div>
  );
};

export default MenuPage;
