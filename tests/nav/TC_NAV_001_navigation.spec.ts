import { test as base, expect } from '@playwright/test';
import { test as authTest } from '../../fixtures/auth.fixture';
import { getTestCases } from '../../utils/excelReader';
import { autoAnnotate } from '../../utils/allure';

const cases = getTestCases({ Module: 'Navigation' });

function tc(id: string) {
  const found = cases.find(t => t['TC_ID'] === id);
  if (!found) throw new Error(`TC "${id}" not found`);
  return found;
}
function title(id: string) {
  const t = tc(id);
  return `[${t['TC_ID']}][${t['Priority']}] ${t['Test Name (TH)']}`;
}

base.describe('Navigation', () => {
  base.beforeEach(async ({}, testInfo) => { await autoAnnotate(testInfo); });

  base.test(title('TC-NAV-01'), async ({ page }) => {
    await base.test.step('When: เปิด Homepage', async () => {
      await page.goto('/');
    });

    await base.test.step('Then: navbar แสดงอยู่', async () => {
      await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
    });
  });

  base.test(title('TC-NAV-02'), async ({ page }) => {
    await base.test.step('Given: เปิด Homepage', async () => {
      await page.goto('/');
    });

    await base.test.step('When: คลิก nav-logo', async () => {
      await page.click('[data-testid="nav-logo"]');
    });

    await base.test.step('Then: navigate ไป Homepage (/)', async () => {
      await expect(page).toHaveURL(/\/$|\/index\.html/);
    });
  });

  base.test(title('TC-NAV-03'), async ({ page }) => {
    await base.test.step('Given: ผู้ใช้ยังไม่ได้ login', async () => {
      await page.goto('/');
    });

    await base.test.step('Then: navbar แสดง nav-login และ nav-register', async () => {
      await expect(page.locator('[data-testid="nav-login"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-register"]')).toBeVisible();
    });
  });

  authTest(title('TC-NAV-04'), async ({ userPage }) => {
    await authTest.step('Given: Login แล้ว', async () => {
      await userPage.goto('/');
    });

    await authTest.step('Then: navbar แสดง nav-user-menu และ nav-cart', async () => {
      await expect(userPage.locator('[data-testid="nav-user-menu"]')).toBeVisible();
      await expect(userPage.locator('[data-testid="nav-cart"]')).toBeVisible();
    });
  });

  base.test(title('TC-NAV-05'), async ({ page }) => {
    await base.test.step('Given: เปิด Homepage', async () => {
      await page.goto('/');
    });

    await base.test.step('When: คลิก nav-login', async () => {
      await page.click('[data-testid="nav-login"]');
    });

    await base.test.step('Then: navigate ไป /login.html', async () => {
      await expect(page).toHaveURL(/login/);
    });
  });

  authTest(title('TC-NAV-06'), async ({ userPage }) => {
    await authTest.step('Given: Login แล้ว เปิด Homepage', async () => {
      await userPage.goto('/');
    });

    await authTest.step('When: คลิก nav-cart', async () => {
      await userPage.click('[data-testid="nav-cart"]');
    });

    await authTest.step('Then: navigate ไป /cart.html', async () => {
      await expect(userPage).toHaveURL(/cart/);
    });
  });

  authTest(title('TC-NAV-07'), async ({ adminPage }) => {
    await authTest.step('Given: Login เป็น admin', async () => {
      await adminPage.goto('/');
    });

    await authTest.step('Then: navbar แสดง nav-admin', async () => {
      await expect(adminPage.locator('[data-testid="nav-admin"]')).toBeVisible();
    });
  });

});
