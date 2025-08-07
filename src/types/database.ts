export interface Organization {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  user_type: 'admin' | 'common' | 'editor';
  created_at: string;
  updated_at: string;
}

export interface UserOrganization {
  id: string;
  user_id: string;
  organization_id: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at: string;
  user?: User;
  organization?: Organization;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  organization?: Organization;
}

export interface Model {
  id: string;
  name: string;
  brand: string;
  category_id: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  category?: Category;
  organization?: Organization;
}

export interface Product {
  id: string;
  name: string;
  model_id: string;
  category_id: string;
  organization_id: string;
  quantity: number;
  min_quantity: number;
  value?: number;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
  model?: Model;
  category?: Category;
  organization?: Organization;
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