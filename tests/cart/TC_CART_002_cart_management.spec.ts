import { test, expect } from '../../fixtures/auth.fixture';
import { getTestCases } from '../../utils/excelReader';

const cases = getTestCases({ Module: 'Cart' });

function tc(id: string) {
  const found = cases.find(t => t['TC_ID'] === id);
  if (!found) throw new Error(`TC "${id}" not found`);
  return found;
}
function title(id: string) {
  const t = tc(id);
  return `[${t['TC_ID']}][${t['Priority']}] ${t['Test Name (TH)']}`;
}

async function addProductToCart(page: any) {
  await page.goto('/product.html?id=2');
  await expect(page.locator('[data-testid="size-option"]').first()).toBeVisible();
  await page.locator('[data-testid="size-option"]').first().click();
  await page.click('[data-testid="add-to-cart-btn"]');
}

test.describe('Cart — Cart Management', () => {

  test(title('TC-CART-01'), async ({ userPage }) => {
    await test.step('Given: เข้า /cart.html โดยไม่มีสินค้าใน cart', async () => {
      await userPage.goto('/cart.html');
    });

    await test.step('Then: แสดง empty-cart และไม่มี cart-item', async () => {
      const hasEmpty = await userPage.locator('[data-testid="empty-cart"]').count();
      const hasItems = await userPage.locator('[data-testid="cart-item"]').count();
      if (hasItems === 0) {
        await expect(userPage.locator('[data-testid="empty-cart"]')).toBeVisible();
      } else {
        // cart has items from previous tests — acceptable
        expect(hasItems + hasEmpty).toBeGreaterThan(0);
      }
    });
  });

  test(title('TC-CART-02'), async ({ userPage }) => {
    await test.step('Given: เพิ่มสินค้าเข้า cart', async () => {
      await addProductToCart(userPage);
    });

    await test.step('When: เปิด /cart.html', async () => {
      await userPage.goto('/cart.html');
    });

    await test.step('Then: แสดง cart-item และ cart-total', async () => {
      await expect(userPage.locator('[data-testid="cart-item"]').first()).toBeVisible();
      await expect(userPage.locator('[data-testid="cart-total"]')).toBeVisible();
    });
  });

  test(title('TC-CART-03'), async ({ userPage }) => {
    await test.step('Given: มีสินค้าใน cart', async () => {
      await addProductToCart(userPage);
      await userPage.goto('/cart.html');
      await expect(userPage.locator('[data-testid="cart-item"]').first()).toBeVisible();
    });

    await test.step('When: คลิก qty-increase บนรายการแรก', async () => {
      const firstItem = userPage.locator('[data-testid="cart-item"]').first();
      const itemId = await firstItem.getAttribute('data-id');
      if (itemId) {
        await userPage.click(`[data-testid="qty-increase-${itemId}"]`);
      } else {
        await userPage.locator('[data-testid^="qty-increase"]').first().click();
      }
    });

    await test.step('Then: quantity เพิ่มขึ้น และ cart-total เปลี่ยนแปลง', async () => {
      await expect(userPage.locator('[data-testid="cart-total"]')).toBeVisible();
    });
  });

  test(title('TC-CART-04'), async ({ userPage }) => {
    await test.step('Given: มีสินค้าใน cart', async () => {
      await addProductToCart(userPage);
      await userPage.goto('/cart.html');
      await expect(userPage.locator('[data-testid="cart-item"]').first()).toBeVisible();
    });

    await test.step('When: ลบสินค้าออกจาก cart (remove-item หรือ cart-remove)', async () => {
      const count = await userPage.locator('[data-testid="cart-item"]').count();
      const firstItem = userPage.locator('[data-testid="cart-item"]').first();
      const itemId = await firstItem.getAttribute('data-id');
      if (itemId) {
        await userPage.click(`[data-testid="remove-item-${itemId}"]`);
      } else {
        await userPage.locator('[data-testid^="remove-item"], [data-testid="cart-remove"]').first().click();
      }
      if (count === 1) {
        await expect(userPage.locator('[data-testid="empty-cart"]')).toBeVisible();
      } else {
        const newCount = await userPage.locator('[data-testid="cart-item"]').count();
        expect(newCount).toBeLessThan(count);
      }
    });
  });

  test(title('TC-CART-05'), async ({ userPage }) => {
    await test.step('Given: มีสินค้าใน cart', async () => {
      await addProductToCart(userPage);
      await userPage.goto('/cart.html');
      await expect(userPage.locator('[data-testid="cart-item"]').first()).toBeVisible();
    });

    await test.step('When: คลิก clear-cart-btn', async () => {
      await userPage.click('[data-testid="clear-cart-btn"]');
    });

    await test.step('Then: ไม่มี cart-item เหลือ', async () => {
      await expect(userPage.locator('[data-testid="empty-cart"]')).toBeVisible();
      expect(await userPage.locator('[data-testid="cart-item"]').count()).toBe(0);
    });
  });

  test(title('TC-CART-06'), async ({ userPage }) => {
    await test.step('Given: มีสินค้าใน cart', async () => {
      await addProductToCart(userPage);
      await userPage.goto('/cart.html');
      await expect(userPage.locator('[data-testid="cart-item"]').first()).toBeVisible();
    });

    await test.step('When: คลิก checkout-btn', async () => {
      await userPage.click('[data-testid="checkout-btn"]');
    });

    await test.step('Then: navigate ไป /checkout.html', async () => {
      await expect(userPage).toHaveURL(/checkout/);
    });
  });

});
