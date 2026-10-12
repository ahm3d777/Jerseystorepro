export type ProductStatus = 'in-stock' | 'low-stock' | 'pre-order' | 'out-of-stock';
export type JerseyType = 'Home' | 'Away' | 'Third' | 'Special';
export type League = 'La Liga' | 'Premier League' | 'Serie A' | 'International';

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  gallery?: string[]; // Multiple images for product detail page
  category: string;
  team: string;
  league: League;
  type: JerseyType;
  isPlayerEdition: boolean;
  status: ProductStatus;
  rating: number;
  reviews: number;
  description: string;
  season?: string;
  color?: string; // Hex code for primary team color (without #)
  stock?: number;   // live stock from the API (undefined for offline fallback data)
  isPreorder?: boolean;
  isActive?: boolean;
}

export interface CartItem extends Product {
  cartId: string;
  selectedSize: string;
  quantity: number;
  customization?: {
    name: string;
    number: string;
    font: string;
  };
}

export type PageView = 'home' | 'shop' | 'product' | 'cart' | 'order' | 'wishlist';

export interface FilterState {
  league: string[];
  type: string[];
  maxPrice: number;
}
export type PaymentMethod = 'bkash' | 'sslcommerz' | 'cod';
export type GatewayMode = 'mock' | 'sandbox' | 'live';

export interface StoreConfig {
  payments: Record<PaymentMethod, GatewayMode>;
}

export interface CheckoutCustomer {
  name: string;
  phone: string;
  email: string;
  district: string;
  address: string;
  note: string;
}

export interface PublicOrder {
  id: string;
  status: 'pending_payment' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: PaymentMethod;
  paymentStatus: 'unpaid' | 'paid' | 'failed' | 'cancelled' | 'refunded';
  trxId: string | null;
  customer: { name: string; phone: string; email: string | null; district: string; address: string };
  subtotal: number;
  shippingFee: number;
  codFee: number;
  total: number;
  createdAt: string;
  items: { name: string; image: string; size: string; quantity: number; unitPrice: number; customization: { name: string; number: string; font: string } | null }[];
  timeline: { message: string; at: string }[];
}
