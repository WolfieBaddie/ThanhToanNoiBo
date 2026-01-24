// src/types/merchant.types.ts

export interface ServiceItem {
    id: number;
    name: string;
    price: number;
    calories: string;
    image: string;
    category: string;
    isAvailable: boolean;
    soldCount: number;
}

export const SERVICE_CATEGORIES = [
    { id: 'all', label: 'Tất cả' },
    { id: 'breakfast', label: 'Bữa sáng' },
    { id: 'lunch', label: 'Bữa trưa' },
    { id: 'drink', label: 'Đồ uống' },
    { id: 'snack', label: 'Ăn vặt' },
];