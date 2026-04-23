import { test, expect } from '@playwright/test';
import { getCredentials } from '../../utils/excelReader';
import { loginAs, bearer } from '../../utils/apiClient';

test.describe('API — Auth', () => {

  test('POST /api/auth/login — valid credentials returns token and user', async ({ request }) => {
    const { username, password } = getCredentials('TC-AUTH-05');

    await test.step('When: POST /api/auth/login ด้วย testuser/test1234', async () => {
      const res = await request.post('/api/auth/login', { data: { username, password } });

      await test.step('Then: 200, มี access_token และ user object ไม่มี password field', async () => {
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('access_token');
        expect(body).toHaveProperty('token_type', 'bearer');
        expect(body.user.username).toBe(username);
        expect(body.user.is_admin).toBe(false);
        expect(body.user).not.toHaveProperty('password');
      });
    });
  });

  test('POST /api/auth/login — wrong password returns 401', async ({ request }) => {
    const { username } = getCredentials('TC-AUTH-05');

    await test.step('When: POST /api/auth/login ด้วย password ผิด', async () => {
      const res = await request.post('/api/auth/login', {
        data: { username, password: 'wrongpassword' },
      });

      await test.step('Then: 401 Unauthorized', async () => {
        expect(res.status()).toBe(401);
      });
    });
  });

  test('GET /api/auth/me — valid token returns current user profile', async ({ request }) => {
    const token = await loginAs(request, 'TC-AUTH-05');
    const { username } = getCredentials('TC-AUTH-05');

    await test.step('When: GET /api/auth/me พร้อม Bearer token', async () => {
      const res = await request.get('/api/auth/me', { headers: bearer(token) });

      await test.step('Then: 200, user profile ตรงกับ account ที่ login', async () => {
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.username).toBe(username);
        expect(body).toHaveProperty('id');
        expect(body).toHaveProperty('email');
        expect(body).not.toHaveProperty('password');
      });
    });
  });

  test('GET /api/auth/me — no token returns 401', async ({ request }) => {
    await test.step('When: GET /api/auth/me โดยไม่มี token', async () => {
      const res = await request.get('/api/auth/me');

      await test.step('Then: 401 Unauthorized', async () => {
        expect(res.status()).toBe(401);
      });
    });
  });

});
