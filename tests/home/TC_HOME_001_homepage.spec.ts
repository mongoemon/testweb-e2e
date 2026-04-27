import { test, expect } from '@playwright/test';
import { getTestCases } from '../../utils/excelReader';
import { autoAnnotate } from '../../utils/allure';

const cases = getTestCases({ Module: 'Homepage' });

function tc(id: string) {
  const found = cases.find(t => t['TC_ID'] === id);
  if (!found) throw new Error(`TC "${id}" not found`);
  return found;
}
function title(id: string) {
  const t = tc(id);
  return `[${t['TC_ID']}][${t['Priority']}] ${t['Test Name (TH)']}`;
}

test.describe('Homepage', () => {
  test.beforeEach(async ({}, testInfo) => { await autoAnnotate(testInfo); });

  test(title('TC-HOME-01'), async ({ page }) => {
    await test.step('When: เปิด / (Homepage)', async () => {
      await page.goto('/');
    });

    await test.step('Then: hero-section, categories-section และ featured-products โหลดสำเร็จ', async () => {
      await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="categories-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="featured-products"]')).toBeVisible();
    });
  });

  test(title('TC-HOME-02'), async ({ page }) => {
    await test.step('Given: เปิด Homepage', async () => {
      await page.goto('/');
    });

    await test.step('When: คลิกปุ่ม "ช้อปเลย" (hero-shop-btn)', async () => {
      await page.click('[data-testid="hero-shop-btn"]');
    });

    await test.step('Then: navigate ไป /products.html', async () => {
      await expect(page).toHaveURL(/products/);
    });
  });

  test(title('TC-HOME-03'), async ({ page }) => {
    await test.step('Given: เปิด Homepage', async () => {
      await page.goto('/');
    });

    await test.step('When: คลิก category card ใน categories-section', async () => {
      await page.locator('[data-testid="category-card"]').first().click();
    });

    await test.step('Then: navigate ไป /products.html พร้อม category filter', async () => {
      await expect(page).toHaveURL(/products/);
    });
  });

});
