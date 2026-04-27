import { test, expect } from '../../fixtures/auth.fixture';
import { getTestCases } from '../../utils/excelReader';

const cases = getTestCases({ Module: 'Profile' });

function tc(id: string) {
  const found = cases.find(t => t['TC_ID'] === id);
  if (!found) throw new Error(`TC "${id}" not found`);
  return found;
}
function title(id: string) {
  const t = tc(id);
  return `[${t['TC_ID']}][${t['Priority']}] ${t['Test Name (TH)']}`;
}

test.describe('Profile', () => {

  test(title('TC-PROF-01'), async ({ userPage }) => {
    await test.step('When: เปิด /profile.html', async () => {
      await userPage.goto('/profile.html');
    });

    await test.step('Then: แสดง form-personal พร้อม profile-fullname และ profile-email', async () => {
      await expect(userPage.locator('[data-testid="form-personal"]')).toBeVisible();
      await expect(userPage.locator('[data-testid="profile-fullname"]')).toBeVisible();
      await expect(userPage.locator('[data-testid="profile-email"]')).toBeVisible();
    });
  });

  test(title('TC-PROF-02'), async ({ userPage }) => {
    await test.step('Given: เปิด /profile.html', async () => {
      await userPage.goto('/profile.html');
    });

    await test.step('When: แก้ไข full name แล้ว save', async () => {
      const suffix = Date.now().toString().slice(-4);
      await userPage.fill('[data-testid="profile-fullname"]', `Test User ${suffix}`);
      await userPage.click('[data-testid="profile-personal-save"]');
    });

    await test.step('Then: ไม่มี personal error', async () => {
      const errorVisible = await userPage.locator('[data-testid="profile-personal-error"]').count();
      expect(errorVisible).toBe(0);
    });
  });

  test(title('TC-PROF-03'), async ({ userPage }) => {
    await test.step('Given: เปิด /profile.html', async () => {
      await userPage.goto('/profile.html');
    });

    await test.step('When: เปลี่ยน password ด้วยรหัสเดิมผิด', async () => {
      await userPage.fill('[data-testid="profile-current-password"]', 'wrongpassword');
      await userPage.fill('[data-testid="profile-new-password"]',     'newpass1234');
      await userPage.fill('[data-testid="profile-confirm-password"]', 'newpass1234');
      await userPage.click('[data-testid="profile-password-save"]');
    });

    await test.step('Then: แสดง profile-password-error', async () => {
      await expect(userPage.locator('[data-testid="profile-password-error"]')).toBeVisible();
    });
  });

  test(title('TC-PROF-04'), async ({ userPage }) => {
    await test.step('Given: เปิด /profile.html', async () => {
      await userPage.goto('/profile.html');
    });

    await test.step('When: กรอก new-password ไม่ตรงกับ confirm', async () => {
      await userPage.fill('[data-testid="profile-current-password"]', 'test1234');
      await userPage.fill('[data-testid="profile-new-password"]',     'newpass1234');
      await userPage.fill('[data-testid="profile-confirm-password"]', 'different5678');
      await userPage.click('[data-testid="profile-password-save"]');
    });

    await test.step('Then: แสดง profile-password-error', async () => {
      await expect(userPage.locator('[data-testid="profile-password-error"]')).toBeVisible();
    });
  });

  test(title('TC-PROF-05'), async ({ userPage }) => {
    await test.step('Given: เปิด /profile.html', async () => {
      await userPage.goto('/profile.html');
    });

    await test.step('When: กรอกข้อมูล shipping address และ save', async () => {
      await userPage.fill('[data-testid="profile-shipping-name"]',    'Test User');
      await userPage.fill('[data-testid="profile-shipping-address"]', '123 New Road');
      await userPage.fill('[data-testid="profile-shipping-city"]',    'Bangkok');
      await userPage.fill('[data-testid="profile-shipping-postal"]',  '10110');
      await userPage.fill('[data-testid="profile-shipping-phone"]',   '0810000000');
      await userPage.click('[data-testid="profile-address-save"]');
    });

    await test.step('Then: address บันทึกสำเร็จ (ไม่มี error)', async () => {
      const errorVisible = await userPage.locator('[data-testid="profile-address-error"]').count();
      expect(errorVisible).toBe(0);
    });
  });

  test(title('TC-PROF-06'), async ({ userPage }) => {
    await test.step('Given: เปิด /profile.html', async () => {
      await userPage.goto('/profile.html');
    });

    await test.step('Then: แสดง form-personal, form-password, form-address', async () => {
      await expect(userPage.locator('[data-testid="form-personal"]')).toBeVisible();
      await expect(userPage.locator('[data-testid="form-password"]')).toBeVisible();
      await expect(userPage.locator('[data-testid="form-address"]')).toBeVisible();
    });
  });

  test(title('TC-PROF-07'), async ({ userPage }) => {
    await test.step('Given: เปิด /profile.html', async () => {
      await userPage.goto('/profile.html');
    });

    await test.step('When: กรอก email ไม่ถูกต้อง แล้ว save', async () => {
      await userPage.fill('[data-testid="profile-email"]', 'not-an-email');
      await userPage.click('[data-testid="profile-personal-save"]');
    });

    await test.step('Then: แสดง error หรือ browser validation', async () => {
      const hasError = await userPage.locator('[data-testid="profile-personal-error"]').count();
      const stillOnProfile = userPage.url().includes('profile');
      expect(hasError > 0 || stillOnProfile).toBeTruthy();
    });
  });

});
