import { test, expect } from '../../fixtures/auth.fixture';

// Product id=2 (Adidas Ultraboost 23) has sizes [38,39,40,41,42,43,44]
const PRODUCT_URL = '/product.html?id=2';

// TC_CART_001 | P0 | Add product to cart
test('TC_CART_001 add product to cart updates cart count', async ({ cartPage }) => {
  await cartPage.goto(PRODUCT_URL);
  await expect(cartPage.locator('[data-testid="size-option"]').first()).toBeVisible();
  await cartPage.locator('[data-testid="size-option"]').first().click();
  await cartPage.click('[data-testid="add-to-cart-btn"]');
  await expect(cartPage.locator('[data-testid="cart-count"]')).not.toHaveText('0');
});

// TC_CART_002 | P1 | Add to cart without selecting size shows error
test('TC_CART_002 add to cart without size shows validation error', async ({ cartPage }) => {
  await cartPage.goto(PRODUCT_URL);
  await expect(cartPage.locator('[data-testid="product-detail"]')).toBeVisible();
  await cartPage.click('[data-testid="add-to-cart-btn"]');
  await expect(cartPage.locator('[data-testid="size-error"]')).toBeVisible();
});

// TC_CART_003 | P1 | Remove item from cart
test('TC_CART_003 remove item from cart decreases item count', async ({ cartPage }) => {
  // Add item first
  await cartPage.goto(PRODUCT_URL);
  await expect(cartPage.locator('[data-testid="size-option"]').first()).toBeVisible();
  await cartPage.locator('[data-testid="size-option"]').first().click();
  await cartPage.click('[data-testid="add-to-cart-btn"]');

  // Wait for cart to reflect the added item before navigating
  await expect(cartPage.locator('[data-testid="cart-count"]')).not.toHaveText('0');

  // Go to cart and remove
  await cartPage.goto('/cart.html');

  // count() does not auto-wait. Without this assertion it can return 0 on a slow
  // render, which turns the check below into toHaveCount(-1) — an assertion that
  // can never pass. That is the failure this spec has been hitting on CI.
  await expect(cartPage.locator('[data-testid="cart-item"]').first()).toBeVisible();
  const initialCount = await cartPage.locator('[data-testid="cart-item"]').count();
  const firstItem = cartPage.locator('[data-testid="cart-item"]').first();
  const itemId = await firstItem.getAttribute('data-id');
  if (itemId) {
    await cartPage.click(`[data-testid="remove-item-${itemId}"]`);
  } else {
    await cartPage.locator('[data-testid^="remove-item"]').first().click();
  }
  if (initialCount === 1) {
    await expect(cartPage.locator('[data-testid="empty-cart"]')).toBeVisible();
  } else {
    await expect(cartPage.locator('[data-testid="cart-item"]')).toHaveCount(initialCount - 1);
  }
});
