# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: checkout/TC_CHK_001_checkout.spec.ts >> Checkout >> [TC-CHK-04][P0] สั่งซื้อสำเร็จ
- Location: tests/checkout/TC_CHK_001_checkout.spec.ts:85:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="checkout-btn"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('[data-testid="checkout-btn"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - navigation [ref=e2]:
    - generic [ref=e4]:
      - link "👟 ShoesHub" [ref=e5] [cursor=pointer]:
        - /url: /
      - generic [ref=e6]:
        - link "หน้าแรก" [ref=e7] [cursor=pointer]:
          - /url: /
        - link "สินค้า" [ref=e8] [cursor=pointer]:
          - /url: /products.html
      - generic [ref=e9]:
        - link "🛒 ตะกร้า" [ref=e10] [cursor=pointer]:
          - /url: /cart.html
        - link "📦 คำสั่งซื้อ" [ref=e11] [cursor=pointer]:
          - /url: /orders.html
        - button "👤 testuser ▾" [ref=e13] [cursor=pointer]
        - button "Change language" [ref=e15] [cursor=pointer]:
          - text: 🌐
          - generic [ref=e16]: ภาษาไทย
        - button "🟡" [ref=e17] [cursor=pointer]
  - main [ref=e18]:
    - heading "ตะกร้าสินค้า" [level=1] [ref=e19]
    - generic [ref=e21]:
      - generic [ref=e22]: 🛒
      - paragraph [ref=e23]: ตะกร้าของคุณว่างเปล่า
      - link "เลือกซื้อสินค้า" [ref=e24] [cursor=pointer]:
        - /url: /products.html
  - contentinfo [ref=e25]: © 2024 ShoesHub · สงวนลิขสิทธิ์
```

# Test source

```ts
  1   | import { test, expect } from '../../fixtures/auth.fixture';
  2   | import { getTestCases } from '../../utils/excelReader';
  3   | 
  4   | const cases = getTestCases({ Module: 'Checkout' });
  5   | 
  6   | function tc(id: string) {
  7   |   const found = cases.find(t => t['TC_ID'] === id);
  8   |   if (!found) throw new Error(`TC "${id}" not found`);
  9   |   return found;
  10  | }
  11  | function title(id: string) {
  12  |   const t = tc(id);
  13  |   return `[${t['TC_ID']}][${t['Priority']}] ${t['Test Name (TH)']}`;
  14  | }
  15  | 
  16  | async function addProductAndGoToCheckout(page: any) {
  17  |   // Clear cart first to avoid parallel-test state conflicts
  18  |   await page.goto('/cart.html');
  19  |   const clearBtn = page.locator('[data-testid="clear-cart-btn"]');
  20  |   if (await clearBtn.isVisible()) await clearBtn.click();
  21  | 
  22  |   await page.goto('/product.html?id=2');
  23  |   await expect(page.locator('[data-testid="size-option"]').first()).toBeVisible();
  24  |   await page.locator('[data-testid="size-option"]').first().click();
  25  |   await page.click('[data-testid="add-to-cart-btn"]');
  26  |   await page.goto('/cart.html');
> 27  |   await expect(page.locator('[data-testid="checkout-btn"]')).toBeVisible();
      |                                                              ^ Error: expect(locator).toBeVisible() failed
  28  |   await page.click('[data-testid="checkout-btn"]');
  29  |   await expect(page).toHaveURL(/checkout/);
  30  | }
  31  | 
  32  | // Serial mode prevents parallel cart state conflicts (shared user account)
  33  | test.describe.configure({ mode: 'serial' });
  34  | 
  35  | test.describe('Checkout', () => {
  36  | 
  37  |   test(title('TC-CHK-01'), async ({ userPage }) => {
  38  |     await test.step('Given: มีสินค้าใน cart และเข้าหน้า checkout', async () => {
  39  |       await addProductAndGoToCheckout(userPage);
  40  |     });
  41  | 
  42  |     await test.step('Then: แสดง checkout-form และ order-summary', async () => {
  43  |       await expect(userPage.locator('[data-testid="checkout-form"]')).toBeVisible();
  44  |       await expect(userPage.locator('[data-testid="order-summary"]')).toBeVisible();
  45  |     });
  46  |   });
  47  | 
  48  |   test(title('TC-CHK-02'), async ({ userPage }) => {
  49  |     await test.step('Given: เข้าหน้า checkout', async () => {
  50  |       await addProductAndGoToCheckout(userPage);
  51  |     });
  52  | 
  53  |     await test.step('When: submit form โดยไม่กรอกข้อมูล', async () => {
  54  |       await userPage.click('[data-testid="place-order-btn"]');
  55  |     });
  56  | 
  57  |     await test.step('Then: แสดง form-error และไม่ submit', async () => {
  58  |       await expect(userPage.locator('[data-testid="form-error"]')).toBeVisible();
  59  |       await expect(userPage).toHaveURL(/checkout/);
  60  |     });
  61  |   });
  62  | 
  63  |   test(title('TC-CHK-03'), async ({ userPage }) => {
  64  |     await test.step('Given: เข้าหน้า checkout', async () => {
  65  |       await addProductAndGoToCheckout(userPage);
  66  |     });
  67  | 
  68  |     await test.step('When: กรอกข้อมูล shipping และ payment ครบแล้ว submit', async () => {
  69  |       await userPage.fill('[data-testid="shipping-name"]',    'Test User');
  70  |       await userPage.fill('[data-testid="shipping-address"]', '123 Test Road');
  71  |       await userPage.fill('[data-testid="shipping-city"]',    'Bangkok');
  72  |       await userPage.fill('[data-testid="shipping-postal"]',  '10110');
  73  |       await userPage.fill('[data-testid="shipping-phone"]',   '0810000000');
  74  |       // Payment: radio buttons — click first option (credit card)
  75  |       const creditCard = userPage.locator('[data-testid="payment-credit-card"]');
  76  |       if (await creditCard.count() > 0) await creditCard.click();
  77  |       await userPage.click('[data-testid="place-order-btn"]');
  78  |     });
  79  | 
  80  |     await test.step('Then: order สำเร็จ — navigate ออกจาก checkout', async () => {
  81  |       await expect(userPage).not.toHaveURL(/checkout/, { timeout: 10000 });
  82  |     });
  83  |   });
  84  | 
  85  |   test(title('TC-CHK-04'), async ({ userPage }) => {
  86  |     await test.step('Given: เข้าหน้า checkout', async () => {
  87  |       await addProductAndGoToCheckout(userPage);
  88  |     });
  89  | 
  90  |     await test.step('When: กรอก phone format ไม่ถูกต้อง แล้ว submit', async () => {
  91  |       await userPage.fill('[data-testid="shipping-name"]',    'Test User');
  92  |       await userPage.fill('[data-testid="shipping-address"]', '123 Test Road');
  93  |       await userPage.fill('[data-testid="shipping-city"]',    'Bangkok');
  94  |       await userPage.fill('[data-testid="shipping-postal"]',  '10110');
  95  |       await userPage.fill('[data-testid="shipping-phone"]',   'INVALID');
  96  |       await userPage.click('[data-testid="place-order-btn"]');
  97  |     });
  98  | 
  99  |     await test.step('Then: แสดง form-error (หรือ browser validation) และยังอยู่หน้า checkout', async () => {
  100 |       const hasFormError = await userPage.locator('[data-testid="form-error"]').count();
  101 |       const stillOnCheckout = userPage.url().includes('checkout');
  102 |       expect(hasFormError > 0 || stillOnCheckout).toBeTruthy();
  103 |     });
  104 |   });
  105 | 
  106 |   test(title('TC-CHK-05'), async ({ userPage }) => {
  107 |     await test.step('Given: เข้าหน้า checkout', async () => {
  108 |       await addProductAndGoToCheckout(userPage);
  109 |     });
  110 | 
  111 |     await test.step('Then: order-summary แสดง item ที่ถูกต้อง', async () => {
  112 |       const summary = userPage.locator('[data-testid="order-summary"]');
  113 |       await expect(summary).toBeVisible();
  114 |       await expect(summary).not.toBeEmpty();
  115 |     });
  116 |   });
  117 | 
  118 | });
  119 | 
```