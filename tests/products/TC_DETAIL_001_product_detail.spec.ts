import { test as base, expect } from '@playwright/test';
import { test as authTest } from '../../fixtures/auth.fixture';
import { getTestCases } from '../../utils/excelReader';
import { autoAnnotate } from '../../utils/allure';

const cases = getTestCases({ Module: 'Product Detail' });

// Product id=2 (Adidas Ultraboost 23) has brand, description, and sizes
const PRODUCT_WITH_SIZES = '/product.html?id=2';

function tc(id: string) {
  const found = cases.find(t => t['TC_ID'] === id);
  if (!found) throw new Error(`TC "${id}" not found`);
  return found;
}
function title(id: string) {
  const t = tc(id);
  return `[${t['TC_ID']}][${t['Priority']}] ${t['Test Name (TH)']}`;
}

base.describe('Products — Product Detail', () => {
  base.beforeEach(async ({}, testInfo) => { await autoAnnotate(testInfo); });

  base.test(title('TC-DETAIL-01'), async ({ page }) => {
    await base.test.step('When: เปิด /product.html?id=2 (Adidas Ultraboost มี brand/desc/sizes)', async () => {
      await page.goto(PRODUCT_WITH_SIZES);
    });

    await base.test.step('Then: แสดง product-detail พร้อม name, price, brand, description', async () => {
      await expect(page.locator('[data-testid="product-detail"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-price"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-brand"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-description"]')).toBeVisible();
    });
  });

  base.test(title('TC-DETAIL-02'), async ({ page }) => {
    await base.test.step('Given: ผู้ใช้ยังไม่ได้ login', async () => {});

    await base.test.step('When: เปิด product detail และกด add-to-cart-btn โดยไม่ login', async () => {
      await page.goto(PRODUCT_WITH_SIZES);
      await expect(page.locator('[data-testid="product-detail"]')).toBeVisible();
      // Select a size first so the auth check (not size-check) triggers
      await page.locator('[data-testid="size-option"]').first().click();
      await page.click('[data-testid="add-to-cart-btn"]');
    });

    await base.test.step('Then: redirect ไป /login.html', async () => {
      await expect(page).toHaveURL(/login/);
    });
  });

  authTest(title('TC-DETAIL-03'), async ({ userPage }) => {
    await authTest.step('Given: Login แล้ว เปิด product ที่มี sizes โดยไม่เลือก size', async () => {
      await userPage.goto(PRODUCT_WITH_SIZES);
      await expect(userPage.locator('[data-testid="product-detail"]')).toBeVisible();
      await expect(userPage.locator('[data-testid="size-option"]').first()).toBeVisible();
    });

    await authTest.step('When: คลิก add-to-cart-btn โดยไม่ได้เลือก size', async () => {
      await userPage.click('[data-testid="add-to-cart-btn"]');
    });

    await authTest.step('Then: แสดง size-error', async () => {
      await expect(userPage.locator('[data-testid="size-error"]')).toBeVisible();
    });
  });

  authTest(title('TC-DETAIL-04'), async ({ userPage }) => {
    await authTest.step('Given: Login แล้ว เปิด product ที่มี sizes', async () => {
      await userPage.goto(PRODUCT_WITH_SIZES);
      await expect(userPage.locator('[data-testid="size-option"]').first()).toBeVisible();
    });

    await authTest.step('When: เลือก size แล้วคลิก add-to-cart-btn', async () => {
      await userPage.locator('[data-testid="size-option"]').first().click();
      await userPage.click('[data-testid="add-to-cart-btn"]');
    });

    await authTest.step('Then: cart-count เพิ่มขึ้น', async () => {
      const cartCount = userPage.locator('[data-testid="cart-count"]');
      await expect(cartCount).toBeVisible();
      const text = await cartCount.textContent();
      expect(parseInt(text || '0')).toBeGreaterThan(0);
    });
  });

  base.test(title('TC-DETAIL-05'), async ({ page }) => {
    await base.test.step('When: เปิด product ที่ไม่มีในระบบ /product.html?id=99999', async () => {
      await page.goto('/product.html?id=99999');
    });

    await base.test.step('Then: แสดง product-not-found', async () => {
      await expect(page.locator('[data-testid="product-not-found"]')).toBeVisible();
    });
  });

});
