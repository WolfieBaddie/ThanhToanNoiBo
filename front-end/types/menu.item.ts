// src/pages/menu/types.ts

// Type trả về từ API (khớp với ServiceResponse bên Backend)
export interface MenuItem {
    serviceId: string;
    serviceCode: string;
    serviceName: string;
    unitPrice: number;
    categoryName: string;
    imageUrl: string | null;
    description?: string;
}

export interface Category {
    categoryId: string;
    categoryName: string;
    categoryCode: string;
    iconUrl?: string; // Nếu sau này có icon
}