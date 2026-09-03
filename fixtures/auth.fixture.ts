import { test as base, request, Page, TestInfo } from '@playwright/test';
import { getCredentials } from '../utils/excelReader';
import { autoAnnotate } from '../utils/allure';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8000';

type Credentials = { username: string; password: string };

type WorkerFixtures = {
  /**
   * One freshly registered account per Playwright worker.
   *
   * The cart lives server-side and is keyed by user. With `fullyParallel: true`
   * the cart and checkout specs run in different workers at the same time, so
   * sharing the seeded `testuser` meant one spec cleared the cart while another
   * was counting it — the cause of the two long-standing CI failures. Giving
   * each worker its own account removes the shared resource, which is a better
   * fix than stacking retries on top of a real race.
   */
  isolatedUser: Credentials;
};

type AuthFixtures = {
  /** Seeded shared account. For tests that read seeded data, e.g. order id 1. */
  userPage: Page;
  /** Seeded admin account. */
  adminPage: Page;
  /** Per-worker account. For any test that mutates the cart. */
  cartPage: Page;
};

async function loginAs(page: Page, username: string, password: string) {
  await page.goto('/');
  await page.click('[data-testid="nav-login"]');
  await page.fill('[data-testid="username-input"]', username);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-btn"]');
  await page.waitForSelector('[data-testid="nav-user-menu"]');
}

export const test = base.extend<AuthFixtures, WorkerFixtures>({
  isolatedUser: [
    async ({}, use, workerInfo) => {
      const stamp = `${workerInfo.workerIndex}${Date.now().toString(36)}`;
      const user: Credentials = {
        username: `e2e_cart_${stamp}`,
        password: 'e2e-cart-pw-1234',
      };

      const ctx = await request.newContext({ baseURL: BASE_URL });
      const res = await ctx.post('/api/auth/register', {
        data: {
          username: user.username,
          email: `${user.username}@e2e.local`,
          password: user.password,
          full_name: 'E2E Cart User',
        },
      });
      const body = await res.text();
      await ctx.dispose();

      if (!res.ok()) {
        throw new Error(
          `Could not register worker account "${user.username}" ` +
            `(HTTP ${res.status()}): ${body}`,
        );
      }

      await use(user);
    },
    { scope: 'worker' },
  ],

  userPage: async ({ browser }, use, testInfo: TestInfo) => {
    await autoAnnotate(testInfo);
    const page = await browser.newPage();
    const { username, password } = getCredentials('TC-AUTH-05');
    await loginAs(page, username, password);
    await use(page);
    await page.close();
  },

  adminPage: async ({ browser }, use, testInfo: TestInfo) => {
    await autoAnnotate(testInfo);
    const page = await browser.newPage();
    const { username, password } = getCredentials('TC-AUTH-06');
    await loginAs(page, username, password);
    await use(page);
    await page.close();
  },

  cartPage: async ({ browser, isolatedUser }, use, testInfo: TestInfo) => {
    await autoAnnotate(testInfo);
    const page = await browser.newPage();
    await loginAs(page, isolatedUser.username, isolatedUser.password);
    await use(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';
