import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../server';

async function request(method: string, path: string, body?: any) {
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3000;
  const url = `http://127.0.0.1:${port}${path}`;

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, body: json };
  } finally {
    server.close();
  }
}

describe('P1 — Coupons Validation Engine Tests', () => {

  test('TC-CPN-01: Valid coupon applies correct discount when order meets minimum', async () => {
    // PHUANH50 requires min 400.000₫, discounts 50.000₫
    const res = await request('POST', '/api/coupons/validate', {
      code: 'PHUANH50',
      subtotal: 500000
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.valid, true);
    assert.equal(res.body.discount, 50000);
    assert.equal(res.body.code, 'PHUANH50');
  });

  test('TC-CPN-02: Rejects coupon when subtotal is below minimum required', async () => {
    // PHUANH50 with subtotal 200.000₫ (< 400.000₫)
    const res = await request('POST', '/api/coupons/validate', {
      code: 'PHUANH50',
      subtotal: 200000
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.valid, false);
    assert.equal(res.body.discount, 0);
  });

  test('TC-CPN-03: Rejects non-existent or fake coupon code', async () => {
    const res = await request('POST', '/api/coupons/validate', {
      code: 'FAKECOUPON99',
      subtotal: 1000000
    });

    assert.equal(res.status, 404);
    assert.equal(res.body.valid, false);
  });
});
