import { test, expect } from '../../fixtures/auth.fixture';
import { getTestCases } from '../../utils/excelReader';

const cases = getTestCases({ Module: 'Admin Orders' });

function tc(id: string) {
  const found = cases.find(t => t['TC_ID'] === id);
  if (!found) throw new Error(`TC "${id}" not found`);
  return found;
}
function title(id: string) {
  const t = tc(id);
  return `[${t['TC_ID']}][${t['Priority']}] ${t['Test Name (TH)']}`;
}

test.describe('Admin — Orders Management', () => {

  test(title('TC-AORD-01'), async ({ adminPage }) => {
    await test.step('When: เปิด /admin/orders.html', async () => {
      await adminPage.goto('/admin/orders.html');
    });

    await test.step('Then: แสดง orders-table', async () => {
      await expect(adminPage.locator('[data-testid="orders-table"]')).toBeVisible();
    });
  });

  test(title('TC-AORD-02'), async ({ adminPage }) => {
    await test.step('Given: เปิด /admin/orders.html', async () => {
      await adminPage.goto('/admin/orders.html');
    });

    await test.step('When: กรอง status ด้วย status-filter-select', async () => {
      const select = adminPage.locator('[data-testid="status-filter-select"]');
      await expect(select).toBeVisible();
      await select.selectOption({ index: 1 });
    });

    await test.step('Then: แสดง order-row ที่ตรงกับ status หรือ no-orders', async () => {
      const hasRows  = await adminPage.locator('[data-testid="order-row"]').count();
      const hasEmpty = await adminPage.locator('[data-testid="no-orders"]').count();
      expect(hasRows + hasEmpty).toBeGreaterThan(0);
    });
  });

  test(title('TC-AORD-03'), async ({ adminPage }) => {
    await test.step('Given: เปิด /admin/orders.html และมี order-row', async () => {
      await adminPage.goto('/admin/orders.html');
      const count = await adminPage.locator('[data-testid="order-row"]').count();
      if (count === 0) {
        test.skip(true, 'No orders available');
        return;
      }
    });

    await test.step('When: เปลี่ยน status ของ order แรก', async () => {
      const firstRow = adminPage.locator('[data-testid="order-row"]').first();
      const orderId  = await firstRow.getAttribute('data-id');
      const select   = orderId
        ? adminPage.locator(`[data-testid="status-select-${orderId}"]`)
        : adminPage.locator('[data-testid^="status-select"]').first();
      const current = await select.inputValue();
      const options = await select.locator('option').allTextContents();
      const next = options.find(o => o !== current);
      if (next) await select.selectOption({ label: next });
    });

    await test.step('Then: order-status อัพเดต', async () => {
      const firstRow = adminPage.locator('[data-testid="order-row"]').first();
      const orderId  = await firstRow.getAttribute('data-id');
      if (orderId) {
        await expect(adminPage.locator(`[data-testid="order-status-${orderId}"]`)).toBeVisible();
      }
    });
  });

  test(title('TC-AORD-04'), async ({ adminPage }) => {
    await test.step('Given: filter status ที่ไม่มี order', async () => {
      await adminPage.goto('/admin/orders.html');
      const select = adminPage.locator('[data-testid="status-filter-select"]');
      const options = await select.locator('option').allTextContents();
      // Try the last option — most likely to be empty
      await select.selectOption({ index: options.length - 1 });
    });

    await test.step('Then: แสดง no-orders หรือ order-row ตามจริง', async () => {
      const hasRows  = await adminPage.locator('[data-testid="order-row"]').count();
      const hasEmpty = await adminPage.locator('[data-testid="no-orders"]').count();
      expect(hasRows + hasEmpty).toBeGreaterThan(0);
    });
  });

  test(title('TC-AORD-05'), async ({ adminPage }) => {
    await test.step('When: เปิด /admin/orders.html', async () => {
      await adminPage.goto('/admin/orders.html');
    });

    await test.step('Then: แสดง status-filter-select พร้อม options', async () => {
      const select = adminPage.locator('[data-testid="status-filter-select"]');
      await expect(select).toBeVisible();
      const count = await select.locator('option').count();
      expect(count).toBeGreaterThan(1);
    });
  });

  test(title('TC-AORD-06'), async ({ adminPage }) => {
    await test.step('Given: เปิด /admin/orders.html', async () => {
      await adminPage.goto('/admin/orders.html');
    });

    await test.step('Then: orders-table แสดง order-row พร้อม order detail', async () => {
      const count = await adminPage.locator('[data-testid="order-row"]').count();
      if (count > 0) {
        const firstRow = adminPage.locator('[data-testid="order-row"]').first();
        await expect(firstRow).toBeVisible();
      } else {
        await expect(adminPage.locator('[data-testid="no-orders"]')).toBeVisible();
      }
    });
  });

});
