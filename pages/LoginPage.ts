import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
    await this.page.click('[data-testid="nav-login"]');
  }

  async login(username: string, password: string) {
    await this.page.fill('[data-testid="username-input"]', username);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-btn"]');
  }

  async expectError(message: string) {
    await expect(this.page.locator('[data-testid="login-error"]')).toContainText(message);
  }

  async expectLoggedIn() {
    await expect(this.page.locator('[data-testid="nav-user-menu"]')).toBeVisible();
  }
}
