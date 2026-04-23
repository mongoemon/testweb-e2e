import { test, expect } from '@playwright/test';
import { loginAs, bearer } from '../../utils/apiClient';

const SHIPPING = {
  shipping_name: 'Test User',
  shipping_address: '123 Test Rd',
  shipping_city: 'Bangkok',
  shipping_postal: '10110',
  shipping_phone: '081-000-0000',
  payment_method: 'credit_card',
};

test.describe('API — Orders', () => {

  let token: string;

  test.beforeEach(async ({ request }) => {
    token = await loginAs(request, 'TC-AUTH-05');
    await request.delete('/api/cart/clear', { headers: bearer(token) });
  });

  test('GET /api/orders — returns order history array', async ({ request }) => {
    await test.step('When: GET /api/orders พร้อม Bearer token', async () => {
      const res = await request.get('/api/orders', { headers: bearer(token) });

      await test.step('Then: 200, response เป็น array', async () => {
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(Array.isArray(body)).toBe(true);
      });
    });
  });

  test('POST /api/orders — place order from cart, cart clears after', async ({ request }) => {
    await test.step('Given: เพิ่มสินค้าเข้า cart', async () => {
      const res = await request.post('/api/cart', {
        headers: bearer(token),
        data: { product_id: 1, size: '42', quantity: 1 },
      });
      expect(res.status()).toBe(200);
    });

    let orderId: number;

    await test.step('When: POST /api/orders พร้อม shipping info', async () => {
      const res = await request.post('/api/orders', {
        headers: bearer(token),
        data: SHIPPING,
      });

      await test.step('Then: 200, order สร้างสำเร็จ status=pending', async () => {
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('id');
        expect(body.status).toBe('pending');
        expect(body.items.length).toBeGreaterThan(0);
        expect(body.total_amount).toBeGreaterThan(0);
        orderId = body.id;
      });
    });

    await test.step('Then: cart ว่างหลัง place order', async () => {
      const cartRes = await request.get('/api/cart', { headers: bearer(token) });
      const cart = await cartRes.json();
      expect(cart.count).toBe(0);
    });
  });

  test('POST /api/orders — empty cart returns 400', async ({ request }) => {
    await test.step('Given: cart ว่าง (clear แล้วใน beforeEach)', async () => {});

    await test.step('When: POST /api/orders ทั้งที่ cart ว่าง', async () => {
      const res = await request.post('/api/orders', {
        headers: bearer(token),
        data: SHIPPING,
      });

      await test.step('Then: 400 Bad Request', async () => {
        expect(res.status()).toBe(400);
      });
    });
  });

});
