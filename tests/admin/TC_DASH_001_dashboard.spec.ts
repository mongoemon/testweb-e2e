import { test, expect } from '../../fixtures/auth.fixture';
import { getTestCases } from '../../utils/excelReader';

const cases = getTestCases({ Module: 'Admin Dashboard' });

function tc(id: string) {
  const found = cases.find(t => t['TC_ID'] === id);
  if (!found) throw new Error(`TC "${id}" not found`);
  return found;
}
function title(id: string) {
  const t = tc(id);
  return `[${t['TC_ID']}][${t['Priority']}] ${t['Test Name (TH)']}`;
}

test.describe('Admin — Dashboard', () => {

  test(title('TC-DASH-01'), async ({ adminPage }) => {
    await test.step('When: เปิด /admin/index.html', async () => {
      await adminPage.goto('/admin/index.html');
    });

    await test.step('Then: แสดง stats-grid พร้อม stat ทั้งหมด', async () => {
      await expect(adminPage.locator('[data-testid="stats-grid"]')).toBeVisible();
      await expect(adminPage.locator('[data-testid="stat-total-orders"]')).toBeVisible();
      await expect(adminPage.locator('[data-testid="stat-revenue"]')).toBeVisible();
      await expect(adminPage.locator('[data-testid="stat-products"]')).toBeVisible();
      await expect(adminPage.locator('[data-testid="stat-users"]')).toBeVisible();
    });
  });

  test(title('TC-DASH-02'), async ({ adminPage }) => {
    await test.step('When: เปิด /admin/index.html', async () => {
      await adminPage.goto('/admin/index.html');
    });

    await test.step('Then: แสดง recent-orders', async () => {
      await expect(adminPage.locator('[data-testid="recent-orders"]')).toBeVisible();
    });
  });

  test(title('TC-DASH-03'), async ({ adminPage }) => {
    await test.step('When: เปิด /admin/index.html', async () => {
      await adminPage.goto('/admin/index.html');
    });

    await test.step('Then: stat-pending-orders แสดงตัวเลข', async () => {
      const pendingEl = adminPage.locator('[data-testid="stat-pending-orders"]');
      await expect(pendingEl).toBeVisible();
      const text = await pendingEl.textContent();
      expect(text).toBeTruthy();
    });
  });

});
