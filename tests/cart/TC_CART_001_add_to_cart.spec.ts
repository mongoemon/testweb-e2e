import { test, expect } from '../../fixtures/auth.fixture';

// TC_CART_001 | P0 | Add product to cart
test('TC_CART_001 add product to cart updates cart count', async ({ userPage }) => {
  await userPage.goto('/products.html');
  await userPage.locator('[data-testid="product-card"]').first().click();
  await userPage.waitForSelector('[data-testid="product-size-option"]');
  await userPage.locator('[data-testid="product-size-option"]').first().click();
  await userPage.click('[data-testid="add-to-cart-btn"]');
  await expect(userPage.locator('[data-testid="cart-count"]')).not.toHaveText('0');
});

// TC_CART_002 | P1 | Add to cart without selecting size shows error
test('TC_CART_002 add to cart without size shows validation error', async ({ userPage }) => {
  await userPage.goto('/products.html');
  await userPage.locator('[data-testid="product-card"]').first().click();
  await userPage.click('[data-testid="add-to-cart-btn"]');
  await expect(userPage.locator('[data-testid="size-error"]')).toBeVisible();
});

// TC_CART_003 | P1 | Remove item from cart
test('TC_CART_003 remove item from cart decreases item count', async ({ userPage }) => {
  // Add item first
  await userPage.goto('/products.html');
  await userPage.locator('[data-testid="product-card"]').first().click();
  await userPage.locator('[data-testid="product-size-option"]').first().click();
  await userPage.click('[data-testid="add-to-cart-btn"]');

  // Go to cart and remove
  await userPage.goto('/cart.html');
  const initialCount = await userPage.locator('[data-testid="cart-item"]').count();
  await userPage.locator('[data-testid="cart-remove"]').first().click();
  await expect(userPage.locator('[data-testid="cart-item"]')).toHaveCount(initialCount - 1);
});
