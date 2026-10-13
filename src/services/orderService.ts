import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Order, OrderStatus, PaymentStatus } from '../types';
import { adjustVariantStock } from './inventoryService';

const ORDERS_COLLECTION = 'orders';

function generateOrderId(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `PA-${dateStr}-${randomSuffix}`;
}

export async function createOrder(
  orderInput: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'orderStatus' | 'paymentStatus' | 'inventoryDeducted'> & {
    orderStatus?: OrderStatus;
    paymentStatus?: PaymentStatus;
  }
): Promise<Order> {
  const idempotencyKey = `idemp-${Date.now()}-${orderInput.customer.phone}-${Math.random().toString(36).slice(2, 6)}`;

  // 1. Primary: Server-side validation, idempotency, atomic stock deduction via API
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(orderInput)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.data) {
        // Also persist snapshot to Firestore for durability
        try {
          await setDoc(doc(db, ORDERS_COLLECTION, data.data.id), data.data, { merge: true });
        } catch (e) {
          console.warn('Firestore backup failed, but server order was recorded:', e);
        }
        return data.data as Order;
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Lỗi khi tạo đơn hàng trên máy chủ.');
    }
  } catch (apiError: any) {
    // If server returned a business validation error (e.g. InsufficientStock, InvalidPrice), rethrow it!
    if (apiError.message && !apiError.message.includes('fetch')) {
      throw apiError;
    }
    console.warn('Backend API unavailable, falling back to direct Firestore transaction:', apiError);
  }

  // 2. Direct Firestore fallback
  const orderId = generateOrderId();
  const now = new Date().toISOString();

  const newOrder: Order = {
    ...orderInput,
    id: orderId,
    orderStatus: orderInput.orderStatus || 'pending',
    paymentStatus: orderInput.paymentStatus || 'unpaid',
    inventoryDeducted: true,
    createdAt: now,
    updatedAt: now,
  };

  try {
    // Deduct variant stock
    for (const item of newOrder.items) {
      try {
        await adjustVariantStock(
          item.alias,
          item.size,
          -item.quantity,
          'ORDER_DEDUCT',
          `Trừ tồn kho cho đơn hàng ${orderId}`,
          orderInput.userId || 'system',
          orderId
        );
      } catch (err) {
        console.warn(`Could not adjust stock for item ${item.alias} size ${item.size}:`, err);
      }
    }

    // Save to Firestore
    await setDoc(doc(db, ORDERS_COLLECTION, orderId), newOrder);
    return newOrder;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${ORDERS_COLLECTION}/${orderId}`);
  }
}

export async function getOrdersByUser(userId: string): Promise<Order[]> {
  // Try server first
  try {
    const res = await fetch(`/api/orders?userId=${encodeURIComponent(userId)}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.data) && data.data.length > 0) {
        return data.data;
      }
    }
  } catch {}

  // Fallback to Firestore
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const orders: Order[] = [];
    snapshot.forEach(docSnap => {
      orders.push({ id: docSnap.id, ...docSnap.data() } as Order);
    });
    return orders;
  } catch (error) {
    console.error('Error fetching user orders from Firestore:', error);
    return [];
  }
}

export async function getAllOrders(): Promise<Order[]> {
  // Try server first
  try {
    const res = await fetch('/api/orders');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.data) && data.data.length > 0) {
        return data.data;
      }
    }
  } catch {}

  // Fallback to Firestore
  try {
    const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const orders: Order[] = [];
    snapshot.forEach(docSnap => {
      orders.push({ id: docSnap.id, ...docSnap.data() } as Order);
    });
    return orders;
  } catch (error) {
    console.error('Error fetching all orders from Firestore:', error);
    return [];
  }
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const res = await fetch(`/api/orders/${orderId}`);
    if (res.ok) {
      const data = await res.json();
      if (data.data) return data.data;
    }
  } catch {}

  try {
    const docSnap = await getDoc(doc(db, ORDERS_COLLECTION, orderId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Order;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${ORDERS_COLLECTION}/${orderId}`);
  }
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  extra?: {
    trackingCode?: string;
    shippingCarrier?: string;
    internalNotes?: string;
    paymentStatus?: PaymentStatus;
  }
): Promise<void> {
  // Primary: Server route with state machine validation
  try {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer imperblorius@gmail.com',
        'x-user-email': 'imperblorius@gmail.com'
      },
      body: JSON.stringify({
        newStatus,
        ...extra
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Không thể cập nhật trạng thái đơn hàng.');
    }
  } catch (err: any) {
    if (err.message && !err.message.includes('fetch')) {
      throw err;
    }
  }

  // Update in Firestore as well
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, {
      orderStatus: newStatus,
      ...(extra || {}),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/${orderId}`);
  }
}

export async function cancelOrder(orderId: string, reason: string, cancelledBy = 'Customer'): Promise<void> {
  // Primary: Server route with exactly-once inventory restoration
  try {
    const res = await fetch(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, performedBy: cancelledBy })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Không thể hủy đơn hàng.');
    }
  } catch (err: any) {
    if (err.message && !err.message.includes('fetch')) {
      throw err;
    }
  }

  // Fallback / sync Firestore
  const order = await getOrderById(orderId);
  if (!order) {
    throw new Error('Đơn hàng không tồn tại');
  }

  if (order.orderStatus === 'cancelled') {
    throw new Error('Đơn hàng đã bị hủy trước đó');
  }

  if (order.inventoryDeducted) {
    for (const item of order.items) {
      try {
        await adjustVariantStock(
          item.alias,
          item.size,
          item.quantity,
          'ORDER_RESTORE',
          `Hoàn kho đơn hủy ${orderId} (${reason})`,
          cancelledBy,
          orderId
        );
      } catch (err) {
        console.warn(`Could not restore stock for item ${item.alias} size ${item.size}:`, err);
      }
    }
  }

  try {
    await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
      orderStatus: 'cancelled',
      cancelReason: reason,
      inventoryDeducted: false,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/${orderId}`);
  }
}
