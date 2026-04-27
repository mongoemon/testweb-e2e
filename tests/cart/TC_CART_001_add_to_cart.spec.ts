import { test, expect } from '../../fixtures/auth.fixture';

// Product id=2 (Adidas Ultraboost 23) has sizes [38,39,40,41,42,43,44]
const PRODUCT_URL = '/product.html?id=2';

// TC_CART_001 | P0 | Add product to cart
test('TC_CART_001 add product to cart updates cart count', async ({ userPage }) => {
  await userPage.goto(PRODUCT_URL);
  await expect(userPage.locator('[data-testid="size-option"]').first()).toBeVisible();
  await userPage.locator('[data-testid="size-option"]').first().click();
  await userPage.click('[data-testid="add-to-cart-btn"]');
  await expect(userPage.locator('[data-testid="cart-count"]')).not.toHaveText('0');
});

// TC_CART_002 | P1 | Add to cart without selecting size shows error
test('TC_CART_002 add to cart without size shows validation error', async ({ userPage }) => {
  await userPage.goto(PRODUCT_URL);
  await expect(userPage.locator('[data-testid="product-detail"]')).toBeVisible();
  await userPage.click('[data-testid="add-to-cart-btn"]');
  await expect(userPage.locator('[data-testid="size-error"]')).toBeVisible();
});

// TC_CART_003 | P1 | Remove item from cart
test('TC_CART_003 remove item from cart decreases item count', async ({ userPage }) => {
  // Add item first
  await userPage.goto(PRODUCT_URL);
  await expect(userPage.locator('[data-testid="size-option"]').first()).toBeVisible();
  await userPage.locator('[data-testid="size-option"]').first().click();
  await userPage.click('[data-testid="add-to-cart-btn"]');

  // Go to cart and remove
  await userPage.goto('/cart.html');
  const initialCount = await userPage.locator('[data-testid="cart-item"]').count();
  const firstItem = userPage.locator('[data-testid="cart-item"]').first();
  const itemId = await firstItem.getAttribute('data-id');
  if (itemId) {
    await userPage.click(`[data-testid="remove-item-${itemId}"]`);
  } else {
    await userPage.locator('[data-testid^="remove-item"]').first().click();
  }
  if (initialCount === 1) {
    await expect(userPage.locator('[data-testid="empty-cart"]')).toBeVisible();
  } else {
    await expect(userPage.locator('[data-testid="cart-item"]')).toHaveCount(initialCount - 1);
  }
});
