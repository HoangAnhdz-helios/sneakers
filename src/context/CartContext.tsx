import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem, Order, Product } from '../types';
import { validateCoupon } from '../services/couponService';

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  appliedCoupon: string;
  couponMessage: string;
  isCheckoutOpen: boolean;
  lastOrder: Order | null;
  addToCart: (product: Product, sizeLabel: string, quantity?: number) => { success: boolean; message: string };
  updateQuantity: (index: number, delta: number) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  applyCouponCode: (code: string) => Promise<{ valid: boolean; message: string }>;
  removeCoupon: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  setLastOrder: (order: Order | null) => void;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

const CART_STORAGE_KEY = 'phuanh_sneaker_cart';
const COUPON_STORAGE_KEY = 'phuanh_sneaker_coupon';
const DEFAULT_SHIPPING_FEE = 30000;
const FREE_SHIPPING_MIN = 1000000;

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<string>(() => {
    try {
      return localStorage.getItem(COUPON_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [discount, setDiscount] = useState<number>(0);
  const [couponMessage, setCouponMessage] = useState<string>('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, appliedCoupon);
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to sync coupon to localStorage:', e);
    }
  }, [appliedCoupon]);

  const subtotal = cart.reduce((acc, item) => acc + item.priceValue * item.quantity, 0);
  const shippingFee = cart.length === 0 ? 0 : (subtotal >= FREE_SHIPPING_MIN ? 0 : DEFAULT_SHIPPING_FEE);
  const total = Math.max(0, subtotal - discount + shippingFee);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Re-validate coupon when subtotal changes
  useEffect(() => {
    if (appliedCoupon && subtotal > 0) {
      validateCoupon(appliedCoupon, subtotal).then(res => {
        if (res.valid) {
          setDiscount(res.discount);
          setCouponMessage(res.message);
        } else {
          setDiscount(0);
          setCouponMessage(res.message);
        }
      });
    } else {
      setDiscount(0);
      setCouponMessage('');
    }
  }, [appliedCoupon, subtotal]);

  const addToCart = (product: Product, sizeLabel: string, quantity = 1) => {
    const sizeInfo = product.sizes.find(s => s.label === sizeLabel);
    if (!sizeInfo || !sizeInfo.available || sizeInfo.quantity <= 0) {
      return { success: false, message: `Size ${sizeLabel} hiện đã hết hàng.` };
    }

    const maxStock = sizeInfo.quantity;
    const existingIndex = cart.findIndex(i => i.alias === product.alias && i.size === sizeLabel);

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + quantity > maxStock) {
        return {
          success: false,
          message: `Chỉ còn ${maxStock} sản phẩm cho size ${sizeLabel}. Bạn đã có ${currentQty} trong giỏ.`
        };
      }
      const updated = [...cart];
      updated[existingIndex].quantity += quantity;
      setCart(updated);
    } else {
      if (quantity > maxStock) {
        return {
          success: false,
          message: `Chỉ còn ${maxStock} sản phẩm cho size ${sizeLabel}.`
        };
      }
      const newItem: CartItem = {
        id: product.id,
        alias: product.alias,
        name: product.name,
        category: product.category,
        image: product.image,
        price: product.price,
        priceValue: product.priceValue,
        size: sizeLabel,
        sizeSku: sizeInfo.sku || product.sku,
        quantity,
        maxStock
      };
      setCart([...cart, newItem]);
    }

    return { success: true, message: `Đã thêm ${product.name} (Size ${sizeLabel}) vào giỏ hàng.` };
  };

  const updateQuantity = (index: number, delta: number) => {
    const item = cart[index];
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }

    if (item.maxStock && newQty > item.maxStock) {
      return;
    }

    const updated = [...cart];
    updated[index].quantity = newQty;
    setCart(updated);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setAppliedCoupon('');
    setCouponMessage('');
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(COUPON_STORAGE_KEY);
    } catch {}
  };

  const applyCouponCode = async (code: string) => {
    const res = await validateCoupon(code, subtotal);
    if (res.valid) {
      setAppliedCoupon(code.trim().toUpperCase());
      setDiscount(res.discount);
      setCouponMessage(res.message);
    } else {
      setDiscount(0);
      setCouponMessage(res.message);
    }
    return { valid: res.valid, message: res.message };
  };

  const removeCoupon = () => {
    setAppliedCoupon('');
    setDiscount(0);
    setCouponMessage('');
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        subtotal,
        discount,
        shippingFee,
        total,
        appliedCoupon,
        couponMessage,
        isCheckoutOpen,
        lastOrder,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyCouponCode,
        removeCoupon,
        openCheckout: () => setIsCheckoutOpen(true),
        closeCheckout: () => setIsCheckoutOpen(false),
        setLastOrder
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
