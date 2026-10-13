import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Coupon } from '../types';
import { INITIAL_COUPONS } from '../data/initialProducts';

const COUPONS_COLLECTION = 'coupons';

export async function fetchCoupons(): Promise<Coupon[]> {
  try {
    const snapshot = await getDocs(collection(db, COUPONS_COLLECTION));
    if (snapshot.empty) {
      // Seed default coupons
      for (const cp of INITIAL_COUPONS) {
        await setDoc(doc(db, COUPONS_COLLECTION, cp.code), {
          ...cp,
          createdAt: new Date().toISOString()
        });
      }
      return INITIAL_COUPONS;
    }

    const coupons: Coupon[] = [];
    snapshot.forEach(docSnap => {
      coupons.push({ id: docSnap.id, ...docSnap.data() } as Coupon);
    });
    return coupons;
  } catch (error) {
    console.warn('Using local coupons fallback:', error);
    return INITIAL_COUPONS;
  }
}

export async function validateCoupon(code: string, subtotal: number): Promise<{ valid: boolean; discount: number; message: string }> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { valid: false, discount: 0, message: 'Vui lòng nhập mã ưu đãi.' };
  }

  // 1. Try server-side validation first
  try {
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: normalized, subtotal })
    });
    const data = await res.json();
    return {
      valid: Boolean(data.valid),
      discount: Number(data.discount) || 0,
      message: data.message || (data.valid ? 'Mã giảm giá hợp lệ.' : 'Mã giảm giá không hợp lệ.')
    };
  } catch {}

  // 2. Fallback to Firestore / local catalog
  try {
    const docSnap = await getDoc(doc(db, COUPONS_COLLECTION, normalized));
    let coupon: Coupon | undefined;

    if (docSnap.exists()) {
      coupon = docSnap.data() as Coupon;
    } else {
      coupon = INITIAL_COUPONS.find(c => c.code === normalized);
    }

    if (!coupon || !coupon.active) {
      return { valid: false, discount: 0, message: 'Mã giảm giá không tồn tại hoặc đã hết hạn.' };
    }

    if (subtotal < coupon.minOrderValue) {
      return {
        valid: false,
        discount: 0,
        message: `Mã ${coupon.code} chỉ áp dụng cho đơn từ ${coupon.minOrderValue.toLocaleString('vi-VN')}₫.`
      };
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, discount: 0, message: 'Mã giảm giá đã hết lượt sử dụng.' };
    }

    let discount = 0;
    if (coupon.discountType === 'percent') {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }

    return {
      valid: true,
      discount: Math.min(discount, subtotal),
      message: `Đã áp dụng mã ${coupon.code}! Giảm ${discount.toLocaleString('vi-VN')}₫.`
    };
  } catch (error) {
    console.error('Error validating coupon:', error);
    return { valid: false, discount: 0, message: 'Lỗi kiểm tra mã giảm giá.' };
  }
}

export async function saveCoupon(coupon: Coupon): Promise<void> {
  const code = coupon.code.trim().toUpperCase();
  try {
    await setDoc(doc(db, COUPONS_COLLECTION, code), {
      ...coupon,
      code,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COUPONS_COLLECTION}/${code}`);
  }
}

export async function deleteCoupon(code: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COUPONS_COLLECTION, code));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COUPONS_COLLECTION}/${code}`);
  }
}
