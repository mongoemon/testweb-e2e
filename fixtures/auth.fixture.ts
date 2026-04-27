import { test as base, Page, TestInfo } from '@playwright/test';
import { getCredentials } from '../utils/excelReader';
import { autoAnnotate } from '../utils/allure';

type AuthFixtures = {
  userPage: Page;
  adminPage: Page;
};

async function loginAs(page: Page, username: string, password: string) {
  await page.goto('/');
  await page.click('[data-testid="nav-login"]');
  await page.fill('[data-testid="username-input"]', username);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-btn"]');
  await page.waitForSelector('[data-testid="nav-user-menu"]');
}

export const test = base.extend<AuthFixtures>({
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
});

export { expect } from '@playwright/test';
