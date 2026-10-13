import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { app, inMemoryStore } from '../server';

// Helper to make test HTTP requests using Node 22 native fetch or custom dispatcher
async function request(method: string, path: string, body?: any, headers: Record<string, string> = {}) {
  // Use local server port if running, or start test instance
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3000;
  const url = `http://127.0.0.1:${port}${path}`;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, headers: res.headers, body: json };
  } finally {
    server.close();
  }
}

describe('P1 — Orders, Pricing & Inventory Integrity Tests', () => {

  test('TC-ORD-01: Rejects order with empty items', async () => {
    const res = await request('POST', '/api/orders', {
      customer: { fullName: 'Nguyen Van A', phone: '0901234567', address: '123 Le Loi', city: 'HCMC' },
      items: [],
      paymentMethod: 'cod'
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'BadRequest');
  });

  test('TC-ORD-02: Rejects order with invalid phone number', async () => {
    const res = await request('POST', '/api/orders', {
      customer: { fullName: 'Nguyen Van A', phone: '123', address: '123 Le Loi', city: 'HCMC' },
      items: [{ alias: 'cortez-1985-do', size: '37', quantity: 1 }],
      paymentMethod: 'cod'
    });

    assert.equal(res.status, 400);
  });

  test('TC-ORD-03: Strict Price Recalculation: Server ignores tampered client unit price', async () => {
    // Client maliciously sends priceValue: 1000₫ for a 460000₫ sneaker
    const res = await request('POST', '/api/orders', {
      customer: { fullName: 'Tester Price', phone: '0912345678', address: '456 Tran Phu', city: 'Hanoi' },
      items: [{
        alias: 'cortez-1985-do',
        size: '37',
        quantity: 1,
        priceValue: 1000 // Client tampering attempt!
      }],
      paymentMethod: 'cod'
    });

    assert.equal(res.status, 201);
    assert.ok(res.body.data);
    // Server must use official catalog price (460000), not the client's 1000!
    assert.equal(res.body.data.subtotal, 460000);
    assert.equal(res.body.data.items[0].priceValue, 460000);
  });

  test('TC-ORD-04: Overselling Prevention: Rejects order when requested quantity exceeds stock', async () => {
    const res = await request('POST', '/api/orders', {
      customer: { fullName: 'Overseller', phone: '0988888888', address: '789 Vo Van Kiet', city: 'Danang' },
      items: [{
        alias: 'cortez-1985-do',
        size: '37',
        quantity: 999 // Stock is only 1-2 pairs
      }],
      paymentMethod: 'cod'
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'InsufficientStock');
  });

  test('TC-ORD-05: Idempotency Key: Prevents duplicate orders on repeated submit', async () => {
    const idempotencyKey = `test-idemp-${Date.now()}`;
    const payload = {
      customer: { fullName: 'Idempotency Tester', phone: '0977777777', address: '10 Hai Ba Trung', city: 'HCMC' },
      items: [{ alias: 'cortez-1985-do', size: '38', quantity: 1 }],
      paymentMethod: 'cod'
    };

    // First request
    const res1 = await request('POST', '/api/orders', payload, { 'X-Idempotency-Key': idempotencyKey });
    assert.equal(res1.status, 201);
    const orderId1 = res1.body.data.id;

    // Second request with exact same idempotency key and payload
    const res2 = await request('POST', '/api/orders', payload, { 'X-Idempotency-Key': idempotencyKey });
    assert.equal(res2.status, 200);
    assert.equal(res2.body.idempotent, true);
    assert.equal(res2.body.data.id, orderId1); // Must return the same order!
  });

  test('TC-ORD-06: Order Cancellation restores inventory exactly once', async () => {
    // 1. Get initial stock of size 39
    const prod = inMemoryStore.products.find(p => p.alias === 'cortez-1985-do')!;
    const sizeObj = prod.sizes.find(s => s.label === '39')!;
    const initialStock = sizeObj.quantity;

    // 2. Create order for 1 pair
    const res = await request('POST', '/api/orders', {
      customer: { fullName: 'Cancel Tester', phone: '0966666666', address: '111 Dong Khoi', city: 'HCMC' },
      items: [{ alias: 'cortez-1985-do', size: '39', quantity: 1 }],
      paymentMethod: 'cod'
    });
    assert.equal(res.status, 201);
    const orderId = res.body.data.id;

    // Stock should be deducted
    assert.equal(sizeObj.quantity, initialStock - 1);

    // 3. Cancel the order
    const cancelRes = await request('POST', `/api/orders/${orderId}/cancel`, {
      reason: 'Khách đổi ý',
      performedBy: 'Customer'
    });
    assert.equal(cancelRes.status, 200);

    // Stock should be restored
    assert.equal(sizeObj.quantity, initialStock);

    // 4. Second cancel attempt must fail and NOT double-restore stock
    const cancelRes2 = await request('POST', `/api/orders/${orderId}/cancel`, {
      reason: 'Hủy lần 2'
    });
    assert.equal(cancelRes2.status, 400);
    assert.equal(cancelRes2.body.error, 'AlreadyCancelled');
    assert.equal(sizeObj.quantity, initialStock); // Stock stays untouched!
  });

  test('TC-ORD-07: State Machine: Rejects invalid order status jump', async () => {
    // Create an order
    const res = await request('POST', '/api/orders', {
      customer: { fullName: 'State Tester', phone: '0955555555', address: '222 Nguyen Hue', city: 'HCMC' },
      items: [{ alias: 'cortez-1985-do', size: '40', quantity: 1 }],
      paymentMethod: 'cod'
    });
    const orderId = res.body.data.id;

    // Cancel the order (moves to terminal state 'cancelled')
    await request('POST', `/api/orders/${orderId}/cancel`, { reason: 'Test' });

    // Attempt invalid jump from 'cancelled' to 'delivered'
    const patchRes = await request('PATCH', `/api/orders/${orderId}/status`, {
      newStatus: 'delivered'
    }, {
      'x-user-email': 'imperblorius@gmail.com'
    });

    assert.equal(patchRes.status, 400);
    assert.equal(patchRes.body.error, 'InvalidTransition');
  });
});
