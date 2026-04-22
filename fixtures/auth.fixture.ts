import { test as base, Page } from '@playwright/test';

type AuthFixtures = {
  userPage: Page;
  adminPage: Page;
};

async function loginAs(page: Page, username: string, password: string) {
  await page.goto('/');
  await page.click('[data-testid="nav-login"]');
  await page.fill('[data-testid="login-username"]', username);
  await page.fill('[data-testid="login-password"]', password);
  await page.click('[data-testid="login-submit"]');
  await page.waitForSelector('[data-testid="nav-user-menu"]');
}

export const test = base.extend<AuthFixtures>({
  userPage: async ({ browser }, use) => {
    const page = await browser.newPage();
    await loginAs(page, 'testuser', 'test1234');
    await use(page);
    await page.close();
  },
  adminPage: async ({ browser }, use) => {
    const page = await browser.newPage();
    await loginAs(page, 'admin', 'admin1234');
    await use(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';
