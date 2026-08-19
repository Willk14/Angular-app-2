export interface Product {
  id: number;
  name?: string;
  title: string;
  price: number;
  categoryId?: number;
  categoryName?: string;
  description?: string;
  images?: string[];
}

export interface User {
  id: number;
  name: string;
  email?: string;
  role: 'admin' | 'user' | string;
  token?: string | null;
}

export interface LoginModel {
  email: string;
  password: string;
}

export type UserModel = User;

export interface Category {
  id: number;
  name: string;
  description?: string;
}
