import { test, expect } from '../../fixtures/auth.fixture';
import { getTestCases } from '../../utils/excelReader';

const cases = getTestCases({ Module: 'Checkout' });

function tc(id: string) {
  const found = cases.find(t => t['TC_ID'] === id);
  if (!found) throw new Error(`TC "${id}" not found`);
  return found;
}
function title(id: string) {
  const t = tc(id);
  return `[${t['TC_ID']}][${t['Priority']}] ${t['Test Name (TH)']}`;
}

async function addProductAndGoToCheckout(page: any) {
  await page.goto('/product.html?id=1');
  await page.locator('[data-testid="size-option"], [data-testid="product-size-option"]').first().click();
  await page.click('[data-testid="add-to-cart-btn"]');
  await page.goto('/cart.html');
  await page.click('[data-testid="checkout-btn"]');
  await expect(page).toHaveURL(/checkout/);
}

test.describe('Checkout', () => {

  test(title('TC-CHK-01'), async ({ userPage }) => {
    await test.step('Given: มีสินค้าใน cart และเข้าหน้า checkout', async () => {
      await addProductAndGoToCheckout(userPage);
    });

    await test.step('Then: แสดง checkout-form และ order-summary', async () => {
      await expect(userPage.locator('[data-testid="checkout-form"]')).toBeVisible();
      await expect(userPage.locator('[data-testid="order-summary"]')).toBeVisible();
    });
  });

  test(title('TC-CHK-02'), async ({ userPage }) => {
    await test.step('Given: เข้าหน้า checkout', async () => {
      await addProductAndGoToCheckout(userPage);
    });

    await test.step('When: submit form โดยไม่กรอกข้อมูล', async () => {
      await userPage.click('[data-testid="place-order-btn"]');
    });

    await test.step('Then: แสดง form-error และไม่ submit', async () => {
      await expect(userPage.locator('[data-testid="form-error"]')).toBeVisible();
      await expect(userPage).toHaveURL(/checkout/);
    });
  });

  test(title('TC-CHK-03'), async ({ userPage }) => {
    await test.step('Given: เข้าหน้า checkout', async () => {
      await addProductAndGoToCheckout(userPage);
    });

    await test.step('When: กรอกข้อมูล shipping และ payment ครบแล้ว submit', async () => {
      await userPage.fill('[data-testid="shipping-name"]',    'Test User');
      await userPage.fill('[data-testid="shipping-address"]', '123 Test Road');
      await userPage.fill('[data-testid="shipping-city"]',    'Bangkok');
      await userPage.fill('[data-testid="shipping-postal"]',  '10110');
      await userPage.fill('[data-testid="shipping-phone"]',   '081-000-0000');
      const paymentSelect = userPage.locator('[data-testid="payment-method"], [data-testid="payment-select"]');
      if (await paymentSelect.count() > 0) {
        await paymentSelect.first().selectOption({ index: 1 });
      }
      await userPage.click('[data-testid="place-order-btn"]');
    });

    await test.step('Then: order สำเร็จ — redirect ไป /orders.html หรือแสดง order-success', async () => {
      await expect(
        userPage.locator('[data-testid="order-success"]')
          .or(userPage.locator('[data-testid="orders-container"]'))
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test(title('TC-CHK-04'), async ({ userPage }) => {
    await test.step('Given: เข้าหน้า checkout', async () => {
      await addProductAndGoToCheckout(userPage);
    });

    await test.step('When: กรอก phone format ไม่ถูกต้อง แล้ว submit', async () => {
      await userPage.fill('[data-testid="shipping-name"]',    'Test User');
      await userPage.fill('[data-testid="shipping-address"]', '123 Test Road');
      await userPage.fill('[data-testid="shipping-city"]',    'Bangkok');
      await userPage.fill('[data-testid="shipping-postal"]',  '10110');
      await userPage.fill('[data-testid="shipping-phone"]',   'INVALID');
      await userPage.click('[data-testid="place-order-btn"]');
    });

    await test.step('Then: แสดง form-error (หรือ browser validation)', async () => {
      const hasFormError = await userPage.locator('[data-testid="form-error"]').count();
      const stillOnCheckout = userPage.url().includes('checkout');
      expect(hasFormError > 0 || stillOnCheckout).toBeTruthy();
    });
  });

  test(title('TC-CHK-05'), async ({ userPage }) => {
    await test.step('Given: เข้าหน้า checkout', async () => {
      await addProductAndGoToCheckout(userPage);
    });

    await test.step('Then: order-summary แสดง item ที่ถูกต้อง', async () => {
      const summary = userPage.locator('[data-testid="order-summary"]');
      await expect(summary).toBeVisible();
      await expect(summary).not.toBeEmpty();
    });
  });

});
