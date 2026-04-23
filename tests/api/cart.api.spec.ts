import { test, expect } from '@playwright/test';
import { loginAs, bearer } from '../../utils/apiClient';

test.describe('API — Cart', () => {

  let token: string;

  test.beforeEach(async ({ request }) => {
    token = await loginAs(request, 'TC-AUTH-05');
    // ล้าง cart ก่อนทุก test เพื่อให้ state สะอาด
    await request.delete('/api/cart/clear', { headers: bearer(token) });
  });

  test('GET /api/cart — no token returns 401', async ({ request }) => {
    await test.step('When: GET /api/cart โดยไม่มี token', async () => {
      const res = await request.get('/api/cart');

      await test.step('Then: 401 Unauthorized', async () => {
        expect(res.status()).toBe(401);
      });
    });
  });

  test('GET /api/cart — authenticated returns cart structure', async ({ request }) => {
    await test.step('When: GET /api/cart พร้อม Bearer token', async () => {
      const res = await request.get('/api/cart', { headers: bearer(token) });

      await test.step('Then: 200, response มี items, total, count', async () => {
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('items');
        expect(body).toHaveProperty('total');
        expect(body).toHaveProperty('count');
        expect(Array.isArray(body.items)).toBe(true);
      });
    });
  });

  test('POST /api/cart — add item, cart count increases', async ({ request }) => {
    await test.step('Given: cart ว่างอยู่', async () => {
      const res = await request.get('/api/cart', { headers: bearer(token) });
      const body = await res.json();
      expect(body.count).toBe(0);
    });

    await test.step('When: POST /api/cart เพิ่ม product_id=1, size="42", qty=2', async () => {
      const res = await request.post('/api/cart', {
        headers: bearer(token),
        data: { product_id: 1, size: '42', quantity: 2 },
      });

      await test.step('Then: 200, cart มี item และ count = 2', async () => {
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.count).toBe(2);
        expect(body.items[0].product_id).toBe(1);
        expect(body.items[0].size).toBe('42');
        expect(body.items[0].subtotal).toBe(body.items[0].price * 2);
      });
    });
  });

  test('DELETE /api/cart/clear — empties entire cart', async ({ request }) => {
    await test.step('Given: เพิ่มสินค้าเข้า cart ก่อน', async () => {
      await request.post('/api/cart', {
        headers: bearer(token),
        data: { product_id: 1, size: '42', quantity: 1 },
      });
    });

    await test.step('When: DELETE /api/cart/clear', async () => {
      const res = await request.delete('/api/cart/clear', { headers: bearer(token) });

      await test.step('Then: 200, cart ว่างเปล่า', async () => {
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.items).toHaveLength(0);
        expect(body.total).toBe(0);
        expect(body.count).toBe(0);
      });
    });
  });

});
