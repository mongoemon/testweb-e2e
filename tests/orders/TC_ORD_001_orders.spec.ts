import { test, expect } from '../../fixtures/auth.fixture';
import { test as base } from '@playwright/test';
import { getTestCases } from '../../utils/excelReader';

const cases = getTestCases({ Module: 'Orders' });

function tc(id: string) {
  const found = cases.find(t => t['TC_ID'] === id);
  if (!found) throw new Error(`TC "${id}" not found`);
  return found;
}
function title(id: string) {
  const t = tc(id);
  return `[${t['TC_ID']}][${t['Priority']}] ${t['Test Name (TH)']}`;
}

test.describe('Orders', () => {

  test(title('TC-ORD-01'), async ({ userPage }) => {
    await test.step('When: เปิด /orders.html หลัง login', async () => {
      await userPage.goto('/orders.html');
    });

    await test.step('Then: แสดง orders-container (หรือ empty-orders)', async () => {
      const hasOrders = await userPage.locator('[data-testid="orders-container"]').count();
      const hasEmpty  = await userPage.locator('[data-testid="empty-orders"]').count();
      expect(hasOrders + hasEmpty).toBeGreaterThan(0);
    });
  });

  test(title('TC-ORD-02'), async ({ userPage }) => {
    await test.step('Given: เปิด /orders.html', async () => {
      await userPage.goto('/orders.html');
    });

    await test.step('When: มี order-card แสดงอยู่ คลิก view-order', async () => {
      const orderCards = userPage.locator('[data-testid="order-card"]');
      const count = await orderCards.count();
      if (count === 0) {
        test.skip(true, 'No orders to view');
        return;
      }
      const firstCard = orderCards.first();
      const orderId = await firstCard.getAttribute('data-id');
      if (orderId) {
        await userPage.click(`[data-testid="view-order-${orderId}"]`);
      } else {
        await userPage.locator('[data-testid^="view-order"]').first().click();
      }
    });

    await test.step('Then: navigate ไป /order-detail.html?id=...', async () => {
      await expect(userPage).toHaveURL(/order-detail/);
    });
  });

  test(title('TC-ORD-03'), async ({ userPage }) => {
    await test.step('Given: เปิด order-detail.html?id=1', async () => {
      await userPage.goto('/order-detail.html?id=1');
    });

    await test.step('Then: แสดง order-detail หรือ order-not-found', async () => {
      const hasDetail   = await userPage.locator('[data-testid="order-detail"]').count();
      const hasNotFound = await userPage.locator('[data-testid="order-not-found"]').count();
      expect(hasDetail + hasNotFound).toBeGreaterThan(0);
    });
  });

  test(title('TC-ORD-04'), async ({ userPage }) => {
    await test.step('When: เปิด /order-detail.html?id=99999 (ไม่มีในระบบ)', async () => {
      await userPage.goto('/order-detail.html?id=99999');
    });

    await test.step('Then: แสดง order-not-found', async () => {
      await expect(userPage.locator('[data-testid="order-not-found"]')).toBeVisible();
    });
  });

});
