import { Page, expect } from '@playwright/test';

export class CartPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/cart.html');
  }

  async expectItemCount(count: number) {
    await expect(this.page.locator('[data-testid="cart-item"]')).toHaveCount(count);
  }

  async removeItem(index = 0) {
    await this.page.locator('[data-testid="cart-remove"]').nth(index).click();
  }

  async proceedToCheckout() {
    await this.page.click('[data-testid="cart-checkout-btn"]');
    await this.page.waitForURL('**/checkout.html');
  }
}
