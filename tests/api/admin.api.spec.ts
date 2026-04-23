import { test, expect } from '@playwright/test';
import { loginAs, bearer } from '../../utils/apiClient';

test.describe('API — Admin', () => {

  let adminToken: string;
  let userToken: string;

  test.beforeAll(async ({ request }) => {
    adminToken = await loginAs(request, 'TC-AUTH-06');
    userToken = await loginAs(request, 'TC-AUTH-05');
  });

  test('GET /api/admin/stats — admin token returns dashboard stats', async ({ request }) => {
    await test.step('When: GET /api/admin/stats ด้วย admin token', async () => {
      const res = await request.get('/api/admin/stats', { headers: bearer(adminToken) });

      await test.step('Then: 200, response มี stats fields ครบ', async () => {
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('total_orders');
        expect(body).toHaveProperty('total_revenue');
        expect(body).toHaveProperty('total_products');
        expect(body).toHaveProperty('total_users');
        expect(body).toHaveProperty('pending_orders');
        expect(body).toHaveProperty('recent_orders');
        expect(Array.isArray(body.recent_orders)).toBe(true);
      });
    });
  });

  test('GET /api/admin/stats — user token (non-admin) returns 403', async ({ request }) => {
    await test.step('When: GET /api/admin/stats ด้วย user token', async () => {
      const res = await request.get('/api/admin/stats', { headers: bearer(userToken) });

      await test.step('Then: 403 Forbidden', async () => {
        expect(res.status()).toBe(403);
      });
    });
  });

  test('GET /api/admin/orders — returns all orders across all users', async ({ request }) => {
    await test.step('When: GET /api/admin/orders ด้วย admin token', async () => {
      const res = await request.get('/api/admin/orders', { headers: bearer(adminToken) });

      await test.step('Then: 200, response เป็น array (ทุก order ของทุก user)', async () => {
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(Array.isArray(body)).toBe(true);
      });
    });
  });

  test('GET /api/admin/users — returns all users without password fields', async ({ request }) => {
    await test.step('When: GET /api/admin/users ด้วย admin token', async () => {
      const res = await request.get('/api/admin/users', { headers: bearer(adminToken) });

      await test.step('Then: 200, users array ไม่มี password field', async () => {
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThan(0);
        body.forEach((user: Record<string, unknown>) => {
          expect(user).not.toHaveProperty('password');
          expect(user).toHaveProperty('username');
          expect(user).toHaveProperty('is_admin');
        });
      });
    });
  });

});
