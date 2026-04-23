import { test, expect } from '@playwright/test';
import { loginAs, bearer } from '../../utils/apiClient';

test.describe('API — Products', () => {

  test('GET /api/products — returns paginated product list', async ({ request }) => {
    await test.step('When: GET /api/products (no auth required)', async () => {
      const res = await request.get('/api/products');

      await test.step('Then: 200, response มี pagination fields และ items array', async () => {
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('items');
        expect(body).toHaveProperty('total');
        expect(body).toHaveProperty('page');
        expect(body).toHaveProperty('limit');
        expect(body).toHaveProperty('pages');
        expect(Array.isArray(body.items)).toBe(true);
        expect(body.items.length).toBeGreaterThan(0);
      });
    });
  });

  test('GET /api/products?search=nike — returns only Nike products', async ({ request }) => {
    await test.step('When: GET /api/products?search=nike', async () => {
      const res = await request.get('/api/products?search=nike');

      await test.step('Then: 200, ทุก item ใน result มี brand หรือ name เป็น Nike', async () => {
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.items.length).toBeGreaterThan(0);
        body.items.forEach((item: { name: string; brand: string }) => {
          const matchesNike =
            item.name.toLowerCase().includes('nike') ||
            item.brand?.toLowerCase().includes('nike');
          expect(matchesNike).toBe(true);
        });
      });
    });
  });

  test('GET /api/products/1 — returns product detail', async ({ request }) => {
    await test.step('When: GET /api/products/1', async () => {
      const res = await request.get('/api/products/1');

      await test.step('Then: 200, product object มี fields ครบ', async () => {
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.id).toBe(1);
        expect(body).toHaveProperty('name');
        expect(body).toHaveProperty('price');
        expect(body).toHaveProperty('sizes');
        expect(Array.isArray(body.sizes)).toBe(true);
      });
    });
  });

  test('GET /api/products/99999 — non-existent product returns 404', async ({ request }) => {
    await test.step('When: GET /api/products/99999 (ไม่มีสินค้านี้)', async () => {
      const res = await request.get('/api/products/99999');

      await test.step('Then: 404 Not Found', async () => {
        expect(res.status()).toBe(404);
      });
    });
  });

  test('POST /api/products — user token (non-admin) returns 403', async ({ request }) => {
    const token = await loginAs(request, 'TC-AUTH-05');

    await test.step('When: POST /api/products ด้วย user token (ไม่ใช่ admin)', async () => {
      const res = await request.post('/api/products', {
        headers: bearer(token),
        data: { name: 'Test Shoe', price: 999 },
      });

      await test.step('Then: 403 Forbidden', async () => {
        expect(res.status()).toBe(403);
      });
    });
  });

});
