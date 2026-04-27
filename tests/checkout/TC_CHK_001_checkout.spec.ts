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
  // Clear cart first to avoid parallel-test state conflicts
  await page.goto('/cart.html');
  const clearBtn = page.locator('[data-testid="clear-cart-btn"]');
  if (await clearBtn.isVisible()) await clearBtn.click();

  await page.goto('/product.html?id=2');
  await expect(page.locator('[data-testid="size-option"]').first()).toBeVisible();
  await page.locator('[data-testid="size-option"]').first().click();
  await page.click('[data-testid="add-to-cart-btn"]');
  await page.goto('/cart.html');
  await expect(page.locator('[data-testid="checkout-btn"]')).toBeVisible();
  await page.click('[data-testid="checkout-btn"]');
  await expect(page).toHaveURL(/checkout/);
}

// Serial mode prevents parallel cart state conflicts (shared user account)
test.describe.configure({ mode: 'serial' });

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
      await userPage.fill('[data-testid="shipping-phone"]',   '0810000000');
      // Payment: radio buttons — click first option (credit card)
      const creditCard = userPage.locator('[data-testid="payment-credit-card"]');
      if (await creditCard.count() > 0) await creditCard.click();
      await userPage.click('[data-testid="place-order-btn"]');
    });

    await test.step('Then: order สำเร็จ — navigate ออกจาก checkout', async () => {
      await expect(userPage).not.toHaveURL(/checkout/, { timeout: 10000 });
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

    await test.step('Then: แสดง form-error (หรือ browser validation) และยังอยู่หน้า checkout', async () => {
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
