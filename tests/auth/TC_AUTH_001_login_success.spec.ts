import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { getTestCases, getTestData } from '../../utils/excelReader';
import { autoAnnotate } from '../../utils/allure';

const authCases = getTestCases({ Module: 'Authentication' });
const allData = getTestData();

function tc(id: string) {
  const found = authCases.find(t => t['TC_ID'] === id);
  if (!found) throw new Error(`Test case "${id}" not found in xlsx`);
  return found;
}

function title(id: string) {
  const t = tc(id);
  return `[${t['TC_ID']}][${t['Priority']}] ${t['Test Name (TH)']}`;
}

function td(dataSetId: string) {
  const found = allData.find(d => d['Data Set ID'] === dataSetId);
  if (!found) throw new Error(`Test data "${dataSetId}" not found in xlsx`);
  return found;
}

// ─── Login ────────────────────────────────────────────────────────────────────

test.describe('Authentication — Login', () => {
  test.beforeEach(async ({}, testInfo) => { await autoAnnotate(testInfo); });

  test(title('TC-AUTH-05'), async ({ page }) => {
    const data = td('TD-AUTH-05');
    const login = new LoginPage(page);

    await test.step(`Given: ${tc('TC-AUTH-05')['Precondition']}`, async () => {
      // seed account มีอยู่ใน server แล้ว
    });

    await test.step('When: เปิด /login.html', async () => {
      await page.goto('/login.html');
    });

    await test.step(`When: กรอก username="${data.Username}" password="${data.Password}" คลิก Login`, async () => {
      await login.login(data.Username, data.Password);
    });

    await test.step('Then: Redirect ไป / และ Navbar แสดง user menu', async () => {
      await expect(page.locator('[data-testid="nav-user-menu"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-login"]')).not.toBeVisible();
    });
  });

  test(title('TC-AUTH-06'), async ({ page }) => {
    const data = td('TD-AUTH-06');
    const login = new LoginPage(page);

    await test.step(`Given: ${tc('TC-AUTH-06')['Precondition']}`, async () => {
      // seed account มีอยู่ใน server แล้ว
    });

    await test.step('When: เปิด /login.html และ login ด้วย admin', async () => {
      await page.goto('/login.html');
      await login.login(data.Username, data.Password);
    });

    await test.step('Then: Navbar แสดง admin link และไม่เห็นปุ่ม Login', async () => {
      await expect(page.locator('[data-testid="nav-admin"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-login"]')).not.toBeVisible();
    });
  });

  test(title('TC-AUTH-07'), async ({ page }) => {
    const data = td('TD-AUTH-07');
    const login = new LoginPage(page);

    await test.step('Given: ผู้ใช้ยังไม่ได้ login', async () => {
      await page.goto('/login.html');
    });

    await test.step(`When: กรอก username="${data.Username}" password="${data.Password}" (ผิด) คลิก Login`, async () => {
      await login.login(data.Username, data.Password);
    });

    await test.step('Then: ไม่ redirect และแสดง error message ในฟอร์ม', async () => {
      await login.expectError('');
      await expect(page).toHaveURL(/login/);
    });
  });

});

// ─── Logout ───────────────────────────────────────────────────────────────────

test.describe('Authentication — Logout', () => {
  test.beforeEach(async ({}, testInfo) => { await autoAnnotate(testInfo); });

  test(title('TC-AUTH-08'), async ({ page }) => {
    const data = td('TD-AUTH-05');
    const login = new LoginPage(page);

    await test.step('Given: Login ด้วย testuser สำเร็จ', async () => {
      await page.goto('/login.html');
      await login.login(data.Username, data.Password);
      await expect(page.locator('[data-testid="nav-user-menu"]')).toBeVisible();
    });

    await test.step('When: คลิก user menu และคลิก ออกจากระบบ', async () => {
      await page.click('[data-testid="nav-user-menu"]');
      await page.click('[data-testid="nav-logout"]');
    });

    await test.step('Then: Navbar แสดง Login/Register และไม่เห็น user menu', async () => {
      await expect(page.locator('[data-testid="nav-login"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-user-menu"]')).not.toBeVisible();
    });
  });

});
