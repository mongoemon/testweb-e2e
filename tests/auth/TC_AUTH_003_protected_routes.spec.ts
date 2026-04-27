import { test, expect } from '@playwright/test';
import { test as authTest } from '../../fixtures/auth.fixture';
import { getTestCases } from '../../utils/excelReader';
import { autoAnnotate } from '../../utils/allure';

const cases = getTestCases({ Module: 'Authentication' });

function tc(id: string) {
  const found = cases.find(t => t['TC_ID'] === id);
  if (!found) throw new Error(`TC "${id}" not found`);
  return found;
}
function title(id: string) {
  const t = tc(id);
  return `[${t['TC_ID']}][${t['Priority']}] ${t['Test Name (TH)']}`;
}

test.describe('Authentication — Protected Routes', () => {
  test.beforeEach(async ({}, testInfo) => { await autoAnnotate(testInfo); });

  test(title('TC-AUTH-09'), async ({ page }) => {
    await test.step('Given: ผู้ใช้ยังไม่ได้ login', async () => {});

    await test.step('When: เข้าหน้า /orders.html โดยตรง', async () => {
      await page.goto('/orders.html');
    });

    await test.step('Then: redirect ไป /login.html หรือแสดง error', async () => {
      await expect(page.locator('[data-testid="orders-error"], [data-testid="login-form"]').first()).toBeVisible();
    });
  });

  test(title('TC-AUTH-10'), async ({ page }) => {
    await test.step('Given: Login เป็น testuser (ไม่ใช่ admin)', async () => {
      await page.goto('/login.html');
      await page.fill('[data-testid="username-input"]', 'testuser');
      await page.fill('[data-testid="password-input"]', 'test1234');
      await page.click('[data-testid="login-btn"]');
      await expect(page.locator('[data-testid="nav-user-menu"]')).toBeVisible();
    });

    await test.step('When: พยายามเข้า /admin/index.html', async () => {
      await page.goto('/admin/index.html');
    });

    await test.step('Then: redirect ออกจากหน้า admin หรือแสดง access denied', async () => {
      await expect(page).not.toHaveURL(/admin/);
    });
  });

});
