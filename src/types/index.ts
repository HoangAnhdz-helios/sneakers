export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  phone?: string;
  address?: string;
  city?: string;
  savedAddresses?: SavedAddress[];
  favorites?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  isDefault?: boolean;
}

export interface ProductSize {
  label: string;
  available: boolean;
  quantity: number;
  sku: string;
}

export interface Product {
  id: number | string;
  alias: string;
  name: string;
  category: string;
  price: string;
  priceValue: number;
  compareAt?: string;
  compareAtValue?: number;
  image: string;
  images: string[];
  available: boolean;
  sku: string;
  description?: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  sizes: ProductSize[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: number | string;
  alias: string;
  name: string;
  category: string;
  image: string;
  price: string;
  priceValue: number;
  size: string;
  sizeSku: string;
  quantity: number;
  maxStock?: number;
}

export type PaymentMethod = 'cod' | 'transfer' | 'card';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type OrderStatus = 'pending' | 'processing' | 'shipping' | 'delivered' | 'cancelled';

export interface OrderCustomer {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  notes?: string;
}

export interface Order {
  id: string; // e.g., PA-20261012-1234
  userId: string; // uid or 'guest'
  userEmail?: string;
  customer: OrderCustomer;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  couponCode?: string;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  trackingCode?: string;
  shippingCarrier?: string;
  internalNotes?: string;
  cancelReason?: string;
  inventoryDeducted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id?: string;
  code: string;
  discountType: 'fixed' | 'percent';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  active: boolean;
  expiryDate?: string;
  createdAt?: string;
}

export type InventoryMovementType = 'IMPORT' | 'EXPORT' | 'ADJUST' | 'ORDER_DEDUCT' | 'ORDER_RESTORE';

export interface InventoryMovement {
  id?: string;
  productAlias: string;
  productName: string;
  sku: string;
  size: string;
  type: InventoryMovementType;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason: string;
  performedBy: string;
  orderId?: string;
  createdAt: string;
}

export interface Banner {
  id?: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  order: number;
  active: boolean;
}

export interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
  qrUrl?: string;
}

export interface StoreSettings {
  id?: string;
  storeName: string;
  hotline: string;
  email: string;
  announcement: string;
  bankInfo: BankInfo;
  shippingFee: number;
  freeShippingMin: number;
}
