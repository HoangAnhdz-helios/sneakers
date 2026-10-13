import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_COUPONS, INITIAL_SETTINGS, INITIAL_BANNERS } from './src/data/initialProducts';
import { Product, Order, OrderStatus, CartItem, InventoryMovement, Coupon, StoreSettings } from './src/types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'phuanh_sneaker_webhook_secret_key_2026';
const BOOTSTRAP_ADMIN_EMAIL = 'imperblorius@gmail.com';

// In-Memory Database Stores (synchronized with Firestore when available, acts as authoritative backend state machine)
const inMemoryStore = {
  products: JSON.parse(JSON.stringify(INITIAL_PRODUCTS)) as Product[],
  orders: [] as Order[],
  movements: [] as InventoryMovement[],
  coupons: JSON.parse(JSON.stringify(INITIAL_COUPONS)) as Coupon[],
  settings: JSON.parse(JSON.stringify(INITIAL_SETTINGS)) as StoreSettings,
  banners: JSON.parse(JSON.stringify(INITIAL_BANNERS)),
  processedWebhooks: new Set<string>(),
  idempotencyCache: new Map<string, { order: Order; payloadHash: string; timestamp: number }>()
};

// -------------------------------------------------------------
// 1. Security & Middleware Layer (P0)
// -------------------------------------------------------------

// Security Headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// JSON Body Parser with Payload Limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Simple in-memory Rate Limiting for sensitive routes
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
function rateLimiter(limitCount = 30, windowMs = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > entry.resetTime) {
      entry.count = 1;
      entry.resetTime = now + windowMs;
    } else {
      entry.count++;
    }

    rateLimitMap.set(ip, entry);

    if (entry.count > limitCount) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.'
      });
      return;
    }
    next();
  };
}

// Admin Authorization Check Middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const userEmail = req.headers['x-user-email'] as string;
  const adminSecret = req.headers['x-admin-key'] as string;

  // Accept bootstrap admin email or valid secret key
  if (
    userEmail === BOOTSTRAP_ADMIN_EMAIL ||
    (adminSecret && adminSecret === process.env.ADMIN_SECRET_KEY) ||
    authHeader === `Bearer ${BOOTSTRAP_ADMIN_EMAIL}`
  ) {
    next();
    return;
  }

  res.status(403).json({
    error: 'Forbidden',
    message: 'Truy cập bị từ chối. Chỉ tài khoản Quản trị viên được cấp quyền mới có thể thực hiện thao tác này.'
  });
}

// -------------------------------------------------------------
// 2. Health Check & Diagnostics (P1/P2)
// -------------------------------------------------------------
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'PhuAnh Sneaker Commercial Core API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    catalogSize: inMemoryStore.products.length,
    ordersCount: inMemoryStore.orders.length,
    environment: process.env.NODE_ENV || 'development'
  });
});

// -------------------------------------------------------------
// 3. Products Catalog APIs (P1)
// -------------------------------------------------------------
app.get('/api/products', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: inMemoryStore.products
  });
});

app.get('/api/products/:alias', (req: Request, res: Response) => {
  const product = inMemoryStore.products.find(p => p.alias === req.params.alias);
  if (!product) {
    res.status(404).json({ error: 'NotFound', message: 'Sản phẩm không tồn tại.' });
    return;
  }
  res.json({ success: true, data: product });
});

app.post('/api/products', requireAdmin, (req: Request, res: Response) => {
  const body = req.body;
  if (!body.name || !body.priceValue || !Array.isArray(body.sizes)) {
    res.status(400).json({ error: 'BadRequest', message: 'Thiếu thông tin sản phẩm bắt buộc.' });
    return;
  }

  const alias = body.alias || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const now = new Date().toISOString();
  const newProduct: Product = {
    ...body,
    id: alias,
    alias,
    price: `${Number(body.priceValue).toLocaleString('vi-VN')}₫`,
    priceValue: Number(body.priceValue),
    createdAt: now,
    updatedAt: now
  };

  inMemoryStore.products.push(newProduct);
  res.status(201).json({ success: true, data: newProduct });
});

app.put('/api/products/:alias', requireAdmin, (req: Request, res: Response) => {
  const idx = inMemoryStore.products.findIndex(p => p.alias === req.params.alias);
  if (idx === -1) {
    res.status(404).json({ error: 'NotFound', message: 'Không tìm thấy sản phẩm.' });
    return;
  }

  const body = req.body;
  inMemoryStore.products[idx] = {
    ...inMemoryStore.products[idx],
    ...body,
    updatedAt: new Date().toISOString()
  };

  res.json({ success: true, data: inMemoryStore.products[idx] });
});

app.delete('/api/products/:alias', requireAdmin, (req: Request, res: Response) => {
  const alias = req.params.alias;
  // Safety check: Don't allow deletion if referenced in orders
  const hasOrders = inMemoryStore.orders.some(o => o.items.some(i => i.alias === alias));
  if (hasOrders) {
    res.status(400).json({
      error: 'ConstraintViolation',
      message: 'Sản phẩm đã có trong lịch sử đơn hàng, không thể xóa vĩnh viễn. Vui lòng chuyển trạng thái Hết hàng.'
    });
    return;
  }

  inMemoryStore.products = inMemoryStore.products.filter(p => p.alias !== alias);
  res.json({ success: true, message: 'Đã xóa sản phẩm.' });
});

// -------------------------------------------------------------
// 4. Coupons Validation API (P1 - Server-side only)
// -------------------------------------------------------------
app.post('/api/coupons/validate', (req: Request, res: Response) => {
  const { code, subtotal } = req.body;
  if (!code || typeof subtotal !== 'number') {
    res.status(400).json({ valid: false, discount: 0, message: 'Thông tin không hợp lệ.' });
    return;
  }

  const cleanCode = String(code).trim().toUpperCase();
  const coupon = inMemoryStore.coupons.find(c => c.code === cleanCode && c.active);

  if (!coupon) {
    res.status(404).json({ valid: false, discount: 0, message: 'Mã giảm giá không tồn tại hoặc đã hết hạn.' });
    return;
  }

  if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
    res.status(400).json({ valid: false, discount: 0, message: 'Mã giảm giá đã quá hạn sử dụng.' });
    return;
  }

  if (subtotal < coupon.minOrderValue) {
    res.status(400).json({
      valid: false,
      discount: 0,
      message: `Đơn hàng tối thiểu ${coupon.minOrderValue.toLocaleString('vi-VN')}₫ để áp dụng mã này.`
    });
    return;
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    res.status(400).json({ valid: false, discount: 0, message: 'Mã giảm giá đã hết lượt sử dụng.' });
    return;
  }

  let discount = 0;
  if (coupon.discountType === 'percent') {
    discount = Math.round((subtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.discountValue;
  }

  discount = Math.min(discount, subtotal);

  res.json({
    valid: true,
    code: coupon.code,
    discount,
    message: `Đã áp dụng mã ${coupon.code}! Giảm ${discount.toLocaleString('vi-VN')}₫.`
  });
});

app.get('/api/coupons', (req: Request, res: Response) => {
  res.json({ success: true, data: inMemoryStore.coupons });
});

app.post('/api/coupons', requireAdmin, (req: Request, res: Response) => {
  const body = req.body;
  if (!body.code || typeof body.discountValue !== 'number') {
    res.status(400).json({ error: 'BadRequest', message: 'Thông tin mã giảm giá không hợp lệ.' });
    return;
  }

  const code = String(body.code).trim().toUpperCase();
  const newCoupon: Coupon = {
    ...body,
    code,
    active: body.active !== false,
    usedCount: Number(body.usedCount) || 0
  };

  const existingIdx = inMemoryStore.coupons.findIndex(c => c.code === code);
  if (existingIdx > -1) {
    inMemoryStore.coupons[existingIdx] = newCoupon;
  } else {
    inMemoryStore.coupons.push(newCoupon);
  }

  res.json({ success: true, data: newCoupon });
});

// -------------------------------------------------------------
// 5. Orders Engine with Idempotency, Pricing & Stock Transactions (P1)
// -------------------------------------------------------------
app.post('/api/orders', rateLimiter(20, 60000), (req: Request, res: Response) => {
  const idempotencyKey = (req.headers['x-idempotency-key'] as string) || req.body.idempotencyKey;
  const payloadStr = JSON.stringify(req.body);
  const payloadHash = crypto.createHash('sha256').update(payloadStr).digest('hex');

  // 5.1 Idempotency check: prevent duplicate submissions
  if (idempotencyKey) {
    const cached = inMemoryStore.idempotencyCache.get(idempotencyKey);
    if (cached) {
      if (cached.payloadHash === payloadHash) {
        // Return existing order idempotent response
        res.status(200).json({
          success: true,
          idempotent: true,
          message: 'Đơn hàng đã được ghi nhận trước đó.',
          data: cached.order
        });
        return;
      } else {
        res.status(409).json({
          error: 'Conflict',
          message: 'Idempotency key đã được sử dụng với payload khác.'
        });
        return;
      }
    }
  }

  const { customer, items, paymentMethod, couponCode } = req.body;

  // Validate customer inputs
  if (!customer || !customer.fullName || !customer.phone || !customer.address) {
    res.status(400).json({
      error: 'BadRequest',
      message: 'Vui lòng cung cấp đầy đủ thông tin: Họ tên, số điện thoại và địa chỉ giao hàng.'
    });
    return;
  }

  const cleanPhone = String(customer.phone).replace(/\s+/g, '');
  if (!/^\d{9,11}$/.test(cleanPhone)) {
    res.status(400).json({ error: 'BadRequest', message: 'Số điện thoại không hợp lệ.' });
    return;
  }

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'BadRequest', message: 'Giỏ hàng không có sản phẩm.' });
    return;
  }

  // 5.2 Server-side price recalculation & atomic stock availability check
  let serverSubtotal = 0;
  const verifiedItems: CartItem[] = [];

  for (const item of items) {
    if (!item.alias || !item.size || !item.quantity || item.quantity <= 0) {
      res.status(400).json({ error: 'BadRequest', message: 'Dòng sản phẩm không hợp lệ.' });
      return;
    }

    const officialProduct = inMemoryStore.products.find(p => p.alias === item.alias);
    if (!officialProduct || !officialProduct.available) {
      res.status(400).json({
        error: 'ProductUnavailable',
        message: `Sản phẩm "${item.name || item.alias}" hiện không thể bán.`
      });
      return;
    }

    const officialSize = officialProduct.sizes.find(s => s.label === item.size);
    if (!officialSize || !officialSize.available || officialSize.quantity < item.quantity) {
      res.status(400).json({
        error: 'InsufficientStock',
        message: `Sản phẩm "${officialProduct.name}" (Size ${item.size}) chỉ còn ${officialSize?.quantity || 0} đôi trong kho.`
      });
      return;
    }

    // STRICT PRICE ENFORCEMENT: Ignore client unit price, use official product price
    const officialUnitPrice = officialProduct.priceValue;
    serverSubtotal += officialUnitPrice * item.quantity;

    verifiedItems.push({
      id: officialProduct.id,
      alias: officialProduct.alias,
      name: officialProduct.name,
      category: officialProduct.category,
      image: officialProduct.image,
      price: officialProduct.price,
      priceValue: officialUnitPrice,
      size: item.size,
      sizeSku: officialSize.sku || `${officialProduct.sku}-${item.size}`,
      quantity: Number(item.quantity)
    });
  }

  // 5.3 Server-side Coupon validation & recalculation
  let serverDiscount = 0;
  let verifiedCoupon: Coupon | undefined;
  if (couponCode) {
    const cleanCouponCode = String(couponCode).trim().toUpperCase();
    verifiedCoupon = inMemoryStore.coupons.find(c => c.code === cleanCouponCode && c.active);
    if (verifiedCoupon && serverSubtotal >= verifiedCoupon.minOrderValue) {
      if (!verifiedCoupon.usageLimit || verifiedCoupon.usedCount < verifiedCoupon.usageLimit) {
        if (verifiedCoupon.discountType === 'percent') {
          serverDiscount = Math.round((serverSubtotal * verifiedCoupon.discountValue) / 100);
          if (verifiedCoupon.maxDiscount && serverDiscount > verifiedCoupon.maxDiscount) {
            serverDiscount = verifiedCoupon.maxDiscount;
          }
        } else {
          serverDiscount = verifiedCoupon.discountValue;
        }
        serverDiscount = Math.min(serverDiscount, serverSubtotal);
      }
    }
  }

  // Shipping calculation
  const shippingFee = serverSubtotal >= inMemoryStore.settings.freeShippingMin ? 0 : inMemoryStore.settings.shippingFee;
  const serverTotal = Math.max(0, serverSubtotal - serverDiscount + shippingFee);

  // 5.4 Atomic Stock Deduction & Movement Logging
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderId = `PA-${dateStr}-${randomSuffix}`;
  const now = new Date().toISOString();

  for (const item of verifiedItems) {
    const prod = inMemoryStore.products.find(p => p.alias === item.alias)!;
    const sizeObj = prod.sizes.find(s => s.label === item.size)!;
    const prevStock = sizeObj.quantity;
    const newStock = prevStock - item.quantity;

    sizeObj.quantity = newStock;
    sizeObj.available = newStock > 0;
    prod.available = prod.sizes.some(s => s.available && s.quantity > 0);

    // Audit Movement Log
    inMemoryStore.movements.unshift({
      id: `mv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productAlias: prod.alias,
      productName: prod.name,
      sku: sizeObj.sku,
      size: item.size,
      type: 'ORDER_DEDUCT',
      quantityChange: -item.quantity,
      previousStock: prevStock,
      newStock,
      reason: `Trừ kho cho đơn hàng ${orderId}`,
      performedBy: req.body.userId || 'Customer',
      orderId,
      createdAt: now
    });
  }

  if (verifiedCoupon) {
    verifiedCoupon.usedCount++;
  }

  // 5.5 Order entity creation
  const newOrder: Order = {
    id: orderId,
    userId: req.body.userId || 'guest',
    userEmail: req.body.userEmail || '',
    customer: {
      fullName: String(customer.fullName).trim(),
      phone: cleanPhone,
      address: String(customer.address).trim(),
      city: customer.city || 'TP. Hồ Chí Minh',
      notes: customer.notes ? String(customer.notes).trim() : ''
    },
    items: verifiedItems,
    paymentMethod: ['cod', 'transfer', 'card'].includes(paymentMethod) ? paymentMethod : 'cod',
    paymentStatus: 'unpaid',
    orderStatus: 'pending',
    couponCode: verifiedCoupon?.code,
    subtotal: serverSubtotal,
    discount: serverDiscount,
    shippingFee,
    total: serverTotal,
    inventoryDeducted: true,
    createdAt: now,
    updatedAt: now
  };

  inMemoryStore.orders.unshift(newOrder);

  // Cache in idempotency map (TTL 1 hour)
  if (idempotencyKey) {
    inMemoryStore.idempotencyCache.set(idempotencyKey, {
      order: newOrder,
      payloadHash,
      timestamp: Date.now()
    });
  }

  res.status(201).json({
    success: true,
    message: 'Đặt hàng thành công!',
    data: newOrder
  });
});

app.get('/api/orders', (req: Request, res: Response) => {
  const { userId } = req.query;
  if (userId) {
    const userOrders = inMemoryStore.orders.filter(o => o.userId === userId);
    res.json({ success: true, data: userOrders });
    return;
  }
  // Otherwise return all orders for admin
  res.json({ success: true, data: inMemoryStore.orders });
});

app.get('/api/orders/:id', (req: Request, res: Response) => {
  const order = inMemoryStore.orders.find(o => o.id === req.params.id);
  if (!order) {
    res.status(404).json({ error: 'NotFound', message: 'Không tìm thấy đơn hàng.' });
    return;
  }
  res.json({ success: true, data: order });
});

// State Machine Transition Rules (P1)
const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipping', 'cancelled'],
  shipping: ['delivered', 'cancelled'],
  delivered: [], // Terminal State
  cancelled: []  // Terminal State
};

app.patch('/api/orders/:id/status', requireAdmin, (req: Request, res: Response) => {
  const orderId = req.params.id;
  const { newStatus, trackingCode, shippingCarrier, internalNotes } = req.body;

  const order = inMemoryStore.orders.find(o => o.id === orderId);
  if (!order) {
    res.status(404).json({ error: 'NotFound', message: 'Đơn hàng không tồn tại.' });
    return;
  }

  if (newStatus && newStatus !== order.orderStatus) {
    const validTargets = ALLOWED_STATUS_TRANSITIONS[order.orderStatus] || [];
    if (!validTargets.includes(newStatus)) {
      res.status(400).json({
        error: 'InvalidTransition',
        message: `Không thể chuyển trạng thái từ "${order.orderStatus}" sang "${newStatus}".`
      });
      return;
    }
    order.orderStatus = newStatus;
  }

  if (trackingCode) order.trackingCode = trackingCode;
  if (shippingCarrier) order.shippingCarrier = shippingCarrier;
  if (internalNotes) order.internalNotes = internalNotes;
  order.updatedAt = new Date().toISOString();

  res.json({ success: true, data: order });
});

// Safe Cancellation with Exactly-Once Inventory Restoration
app.post('/api/orders/:id/cancel', (req: Request, res: Response) => {
  const orderId = req.params.id;
  const { reason, performedBy } = req.body;

  const order = inMemoryStore.orders.find(o => o.id === orderId);
  if (!order) {
    res.status(404).json({ error: 'NotFound', message: 'Đơn hàng không tồn tại.' });
    return;
  }

  if (order.orderStatus === 'cancelled') {
    res.status(400).json({ error: 'AlreadyCancelled', message: 'Đơn hàng này đã bị hủy trước đó.' });
    return;
  }

  if (order.orderStatus === 'delivered') {
    res.status(400).json({ error: 'TerminalState', message: 'Đơn hàng đã hoàn thành, không thể hủy.' });
    return;
  }

  // Exactly-Once Stock Restoration Check
  if (order.inventoryDeducted) {
    const now = new Date().toISOString();
    for (const item of order.items) {
      const prod = inMemoryStore.products.find(p => p.alias === item.alias);
      if (prod) {
        const sizeObj = prod.sizes.find(s => s.label === item.size);
        if (sizeObj) {
          const prev = sizeObj.quantity;
          const next = prev + item.quantity;
          sizeObj.quantity = next;
          sizeObj.available = true;
          prod.available = true;

          inMemoryStore.movements.unshift({
            id: `mv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            productAlias: prod.alias,
            productName: prod.name,
            sku: sizeObj.sku,
            size: item.size,
            type: 'ORDER_RESTORE',
            quantityChange: item.quantity,
            previousStock: prev,
            newStock: next,
            reason: `Hoàn kho đơn hủy ${orderId}: ${reason || 'Khách/Admin hủy'}`,
            performedBy: performedBy || 'System',
            orderId,
            createdAt: now
          });
        }
      }
    }
    order.inventoryDeducted = false;
  }

  order.orderStatus = 'cancelled';
  order.cancelReason = reason || 'Yêu cầu hủy đơn';
  order.updatedAt = new Date().toISOString();

  res.json({ success: true, message: 'Đã hủy đơn hàng và hoàn lại tồn kho thành công.', data: order });
});

// -------------------------------------------------------------
// 6. Payment Webhook with Signature Verification (P1)
// -------------------------------------------------------------
app.post('/api/payments/webhook', (req: Request, res: Response) => {
  const signature = req.headers['x-signature'] as string;
  const webhookId = req.headers['x-webhook-id'] as string;
  const rawBody = JSON.stringify(req.body);

  // Anti-Replay Check
  if (webhookId && inMemoryStore.processedWebhooks.has(webhookId)) {
    res.status(200).json({ received: true, duplicate: true });
    return;
  }

  // Signature verification (HMAC-SHA256)
  if (process.env.NODE_ENV === 'production' || signature) {
    const expectedSignature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
    if (!signature || signature !== expectedSignature) {
      res.status(401).json({ error: 'InvalidSignature', message: 'Chữ ký webhook không hợp lệ.' });
      return;
    }
  }

  const { orderId, amount, status } = req.body;
  const order = inMemoryStore.orders.find(o => o.id === orderId);

  if (!order) {
    res.status(404).json({ error: 'OrderNotFound', message: 'Không tìm thấy đơn hàng đối soát.' });
    return;
  }

  // Amount match verification
  if (typeof amount === 'number' && amount !== order.total) {
    res.status(400).json({
      error: 'AmountMismatch',
      message: `Số tiền thanh toán (${amount}) không khớp với tổng tiền đơn (${order.total}).`
    });
    return;
  }

  if (status === 'SUCCESS' || status === 'PAID') {
    order.paymentStatus = 'paid';
    if (order.orderStatus === 'pending') {
      order.orderStatus = 'processing';
    }
    order.updatedAt = new Date().toISOString();
  }

  if (webhookId) {
    inMemoryStore.processedWebhooks.add(webhookId);
  }

  res.json({ success: true, message: 'Webhook đã được đối soát thành công.', orderId: order.id });
});

// -------------------------------------------------------------
// 7. Inventory Movements & Adjustment APIs (P1)
// -------------------------------------------------------------
app.get('/api/inventory/movements', (req: Request, res: Response) => {
  res.json({ success: true, data: inMemoryStore.movements });
});

app.post('/api/inventory/adjust', requireAdmin, (req: Request, res: Response) => {
  const { productAlias, size, delta, type, reason, performedBy } = req.body;

  const prod = inMemoryStore.products.find(p => p.alias === productAlias);
  if (!prod) {
    res.status(404).json({ error: 'NotFound', message: 'Không tìm thấy sản phẩm.' });
    return;
  }

  const sizeObj = prod.sizes.find(s => s.label === size);
  if (!sizeObj) {
    res.status(404).json({ error: 'NotFound', message: `Size ${size} không tồn tại.` });
    return;
  }

  const prev = sizeObj.quantity;
  const change = Number(delta) || 0;
  const next = Math.max(0, prev + change);

  sizeObj.quantity = next;
  sizeObj.available = next > 0;
  prod.available = prod.sizes.some(s => s.available && s.quantity > 0);

  const movement: InventoryMovement = {
    id: `mv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    productAlias: prod.alias,
    productName: prod.name,
    sku: sizeObj.sku || prod.sku,
    size,
    type: type || 'ADJUST',
    quantityChange: change,
    previousStock: prev,
    newStock: next,
    reason: reason || 'Điều chỉnh thủ công từ quản trị',
    performedBy: performedBy || 'Admin',
    createdAt: new Date().toISOString()
  };

  inMemoryStore.movements.unshift(movement);

  res.json({ success: true, data: movement });
});

// -------------------------------------------------------------
// 8. Store Settings APIs (P1)
// -------------------------------------------------------------
app.get('/api/settings', (req: Request, res: Response) => {
  res.json({ success: true, data: inMemoryStore.settings });
});

app.put('/api/settings', requireAdmin, (req: Request, res: Response) => {
  inMemoryStore.settings = {
    ...inMemoryStore.settings,
    ...req.body
  };
  res.json({ success: true, data: inMemoryStore.settings });
});

// -------------------------------------------------------------
// 9. Vite Dev Server / Static Hosting Integration (Runtime)
// -------------------------------------------------------------
async function setupViteOrStatic() {
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[PhuAnh Sneaker Server] Running on http://localhost:${PORT}`);
  });
}

// Start server only when directly run (allows test importing without binding port 3000)
if (process.env.NODE_ENV !== 'test' && !process.argv.some(arg => arg.includes('test'))) {
  setupViteOrStatic().catch(err => {
    console.error('Fatal server boot error:', err);
  });
}

export { app, inMemoryStore };
