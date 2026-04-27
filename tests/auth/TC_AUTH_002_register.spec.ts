import { test, expect } from '@playwright/test';
import { getTestCases, getTestData } from '../../utils/excelReader';

const cases   = getTestCases({ Module: 'Authentication' });
const allData = getTestData();

function tc(id: string) {
  const found = cases.find(t => t['TC_ID'] === id);
  if (!found) throw new Error(`TC "${id}" not found`);
  return found;
}
function title(id: string) {
  const t = tc(id);
  return `[${t['TC_ID']}][${t['Priority']}] ${t['Test Name (TH)']}`;
}
function td(dataSetId: string) {
  const found = allData.find(d => d['Data Set ID'] === dataSetId);
  if (!found) throw new Error(`TD "${dataSetId}" not found`);
  return found;
}

test.describe('Authentication — Register', () => {

  test(title('TC-AUTH-01'), async ({ page }) => {
    // username ต้องไม่ซ้ำ — ใส่ timestamp เพื่อให้ unique ทุกครั้งที่รัน
    const suffix   = Date.now().toString().slice(-6);
    const username = `newuser${suffix}`;
    const email    = `newuser${suffix}@test.com`;

    await test.step(`Given: ${tc('TC-AUTH-01')['Precondition']}`, async () => {});

    await test.step('When: เปิด /register.html และกรอกข้อมูลครบถ้วน', async () => {
      await page.goto('/register.html');
      await page.fill('[data-testid="full-name-input"]',       'Test New User');
      await page.fill('[data-testid="username-input"]',        username);
      await page.fill('[data-testid="email-input"]',           email);
      await page.fill('[data-testid="password-input"]',        'pass1234');
      await page.fill('[data-testid="confirm-password-input"]','pass1234');
      await page.click('[data-testid="register-btn"]');
    });

    await test.step('Then: แสดง success message หรือ redirect ไป / พร้อม nav-user-menu', async () => {
      await expect(page.locator('[data-testid="register-success"], [data-testid="nav-user-menu"]').first()).toBeVisible();
    });
  });

  test(title('TC-AUTH-02'), async ({ page }) => {
    const data = td('TD-AUTH-02');

    await test.step(`Given: ${tc('TC-AUTH-02')['Precondition']}`, async () => {});

    await test.step(`When: กรอก username="${data.Username}" ที่มีอยู่แล้วในระบบ และ submit`, async () => {
      await page.goto('/register.html');
      await page.fill('[data-testid="full-name-input"]',        data['Full Name']);
      await page.fill('[data-testid="username-input"]',         data.Username);
      await page.fill('[data-testid="email-input"]',            data.Email);
      await page.fill('[data-testid="password-input"]',         data.Password);
      await page.fill('[data-testid="confirm-password-input"]', data['Confirm PW']);
      await page.click('[data-testid="register-btn"]');
    });

    await test.step('Then: แสดง error และยังอยู่หน้า register', async () => {
      await expect(page.locator('[data-testid="register-error"]')).toBeVisible();
      await expect(page).toHaveURL(/register/);
    });
  });

  test(title('TC-AUTH-03'), async ({ page }) => {
    await test.step('Given: เปิด /register.html', async () => {
      await page.goto('/register.html');
    });

    await test.step('When: กรอก password สั้นกว่า 6 ตัว แล้ว submit', async () => {
      await page.fill('[data-testid="full-name-input"]',        'Test User');
      await page.fill('[data-testid="username-input"]',         'shortpwtest');
      await page.fill('[data-testid="email-input"]',            'short@test.com');
      await page.fill('[data-testid="password-input"]',         'abc');
      await page.fill('[data-testid="confirm-password-input"]', 'abc');
      await page.click('[data-testid="register-btn"]');
    });

    await test.step('Then: แสดง error และไม่สร้าง account', async () => {
      await expect(page.locator('[data-testid="register-error"]')).toBeVisible();
      await expect(page).toHaveURL(/register/);
    });
  });

  test(title('TC-AUTH-04'), async ({ page }) => {
    await test.step('Given: เปิด /register.html', async () => {
      await page.goto('/register.html');
    });

    await test.step('When: กรอก password="pass1234" confirm="pass9999" แล้ว submit', async () => {
      await page.fill('[data-testid="full-name-input"]',        'Test User');
      await page.fill('[data-testid="username-input"]',         'pwmismatch');
      await page.fill('[data-testid="email-input"]',            'mismatch@test.com');
      await page.fill('[data-testid="password-input"]',         'pass1234');
      await page.fill('[data-testid="confirm-password-input"]', 'pass9999');
      await page.click('[data-testid="register-btn"]');
    });

    await test.step('Then: แสดง error รหัสผ่านไม่ตรงกัน และไม่ส่ง API', async () => {
      await expect(page.locator('[data-testid="register-error"]')).toBeVisible();
      await expect(page).toHaveURL(/register/);
    });
  });

});
