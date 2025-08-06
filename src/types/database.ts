export interface User {
  id: string;
  name: string;
  email: string;
  user_type: 'admin' | 'comum';
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Model {
  id: string;
  name: string;
  brand: string;
  category_id: string;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Product {
  id: string;
  name: string;
  model_id: string;
  category_id: string;
  quantity: number;
  min_quantity: number;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
  model?: Model;
  category?: Category;
}

export interface Notification {
  id: string;
  type: 'low_stock' | 'expiry_warning' | 'new_item';
  message: string;
  product_id?: string;
  is_read: boolean;
  created_at: string;
  product?: Product;
}