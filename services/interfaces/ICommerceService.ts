/**
 * LidaCacau - Interface de Serviço de Comércio (LidaShop)
 * 
 * Define o contrato para gerenciamento de lojas e produtos.
 */

import { Store, Product, CartItem, Order, StoreSignup } from '@/types';

export interface CreateStoreData {
  name: string;
  ownerId: string;
  description?: string;
  location?: string;
  logo?: string;
  bannerImage?: string;
  categories?: string[];
}

export interface CreateProductData {
  storeId: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  category: string;
  images?: string[];
  stock?: number;
  isAvailable?: boolean;
}

export interface CreateOrderData {
  buyerId: string;
  storeId: string;
  items: Array<{
    productId: string;
    quantity: number;
    priceAtPurchase: number;
  }>;
  deliveryAddress?: string;
  notes?: string;
}

export interface StoreFilters {
  ownerId?: string;
  category?: string;
  location?: string;
  isActive?: boolean;
}

export interface ProductFilters {
  storeId?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  isAvailable?: boolean;
}

export interface ICommerceService {
  // Lojas
  getStores(filters?: StoreFilters): Promise<Store[]>;
  getStoreById(id: string): Promise<Store | null>;
  getStoresByOwner(ownerId: string): Promise<Store[]>;
  createStore(data: CreateStoreData): Promise<Store>;
  updateStore(storeId: string, updates: Partial<Store>): Promise<Store | null>;
  deleteStore(storeId: string): Promise<boolean>;
  
  // Produtos
  getProducts(filters?: ProductFilters): Promise<Product[]>;
  getProductById(id: string): Promise<Product | null>;
  getProductsByStore(storeId: string): Promise<Product[]>;
  createProduct(data: CreateProductData): Promise<Product>;
  updateProduct(productId: string, updates: Partial<Product>): Promise<Product | null>;
  deleteProduct(productId: string): Promise<boolean>;
  
  // Carrinho
  getCart(userId: string): Promise<CartItem[]>;
  addToCart(userId: string, productId: string, quantity: number): Promise<CartItem>;
  updateCartItem(userId: string, productId: string, quantity: number): Promise<CartItem | null>;
  removeFromCart(userId: string, productId: string): Promise<boolean>;
  clearCart(userId: string): Promise<void>;
  
  // Pedidos
  getOrdersByBuyer(buyerId: string): Promise<Order[]>;
  getOrdersBySeller(sellerId: string): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | null>;
  createOrder(data: CreateOrderData): Promise<Order>;
  updateOrderStatus(orderId: string, status: Order['status']): Promise<Order | null>;
  
  // Store Signups (solicitações de loja)
  getStoreSignups(): Promise<StoreSignup[]>;
  createStoreSignup(userId: string, data: Partial<StoreSignup>): Promise<StoreSignup>;
  approveStoreSignup(signupId: string): Promise<Store>;
  rejectStoreSignup(signupId: string, reason: string): Promise<void>;
}
