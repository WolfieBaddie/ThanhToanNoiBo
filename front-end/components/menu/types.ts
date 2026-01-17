
import React from 'react';

export interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export interface Day {
  id: string;
  label: string;
  date: string;
}

export interface MenuItem {
  id: number;
  name: string;
  cal: string;
  price: number;
  img: string;
  categoryId: string;
  type: string;
}
