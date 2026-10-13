import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { app, inMemoryStore } from '../server';

const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'phuanh_sneaker_webhook_secret_key_2026';

async function request(method: string, path: string, body?: any, headers: Record<string, string> = {}) {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3000;
  const url = `http://127.0.0.1:${port}${path}`;

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, body: json };
  } finally {
    server.close();
  }
}

describe('P0/P1 — Security, Authorization & Payment Webhook Tests', () => {

  test('TC-SEC-01: Admin API blocks unauthenticated and non-admin requests', async () => {
    // Attempt to create a product without admin credentials
    const res = await request('POST', '/api/products', {
      name: 'Hacker Shoe',
      priceValue: 100000,
      sizes: []
    });

    assert.equal(res.status, 403);
    assert.equal(res.body.error, 'Forbidden');
  });

  test('TC-SEC-02: Admin API permits authorized admin (imperblorius@gmail.com)', async () => {
    const res = await request('POST', '/api/products', {
      name: 'Admin Authorized Sneaker',
      category: 'NIKE',
      sku: 'SEC001',
      priceValue: 500000,
      sizes: [{ label: '38', available: true, quantity: 10, sku: 'SEC001-38' }]
    }, {
      'x-user-email': 'imperblorius@gmail.com'
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.name, 'Admin Authorized Sneaker');
  });

  test('TC-SEC-03: Payment Webhook rejects invalid HMAC signature', async () => {
    const payload = { orderId: 'PA-TEST-1', amount: 500000, status: 'SUCCESS' };
    const fakeSignature = 'bad_signature_123456';

    const res = await request('POST', '/api/payments/webhook', payload, {
      'x-signature': fakeSignature
    });

    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'InvalidSignature');
  });

  test('TC-SEC-04: Payment Webhook validates HMAC signature and updates order to PAID', async () => {
    // 1. Create a legitimate order first
    const orderRes = await request('POST', '/api/orders', {
      customer: { fullName: 'Webhook Customer', phone: '0933333333', address: '888 Le Duan', city: 'HCMC' },
      items: [{ alias: 'cortez-1985-do', size: '41', quantity: 1 }],
      paymentMethod: 'card'
    });
    assert.equal(orderRes.status, 201);
    const order = orderRes.body.data;
    assert.equal(order.paymentStatus, 'unpaid');

    // 2. Generate legitimate HMAC-SHA256 signature
    const webhookPayload = {
      orderId: order.id,
      amount: order.total,
      status: 'PAID'
    };
    const rawBody = JSON.stringify(webhookPayload);
    const validSignature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');

    // 3. Send webhook
    const webhookRes = await request('POST', '/api/payments/webhook', webhookPayload, {
      'x-signature': validSignature,
      'x-webhook-id': `wh-${Date.now()}`
    });

    assert.equal(webhookRes.status, 200);
    assert.equal(webhookRes.body.success, true);

    // 4. Verify order is now marked PAID in the database
    const verifyRes = await request('GET', `/api/orders/${order.id}`);
    assert.equal(verifyRes.body.data.paymentStatus, 'paid');
  });

  test('TC-SEC-05: Payment Webhook rejects amount mismatch', async () => {
    // Create an order
    const orderRes = await request('POST', '/api/orders', {
      customer: { fullName: 'Amount Mismatch Customer', phone: '0944444444', address: '999 Nguyen Trai', city: 'HCMC' },
      items: [{ alias: 'cortez-1985-do', size: '42', quantity: 1 }],
      paymentMethod: 'transfer'
    });
    const order = orderRes.body.data;

    // Send webhook with incorrect amount (1.000₫ instead of actual total)
    const webhookPayload = {
      orderId: order.id,
      amount: 1000,
      status: 'PAID'
    };
    const rawBody = JSON.stringify(webhookPayload);
    const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');

    const webhookRes = await request('POST', '/api/payments/webhook', webhookPayload, {
      'x-signature': signature
    });

    assert.equal(webhookRes.status, 400);
    assert.equal(webhookRes.body.error, 'AmountMismatch');
  });
});
