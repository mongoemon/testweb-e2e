import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

// TC_AUTH_001 | P0 | Login with valid credentials
test('TC_AUTH_001 login with valid credentials shows user menu', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login('testuser', 'test1234');
  await login.expectLoggedIn();
});

// TC_AUTH_002 | P0 | Login with wrong password shows error
test('TC_AUTH_002 login with wrong password shows error message', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login('testuser', 'wrongpassword');
  await login.expectError('');
});

// TC_AUTH_003 | P1 | Login with non-existent user shows error
test('TC_AUTH_003 login with non-existent user shows error', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login('nobody', 'test1234');
  await login.expectError('');
});

// TC_AUTH_004 | P0 | Logout clears session
test('TC_AUTH_004 logout clears session and hides user menu', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login('testuser', 'test1234');
  await login.expectLoggedIn();

  await page.click('[data-testid="nav-user-menu"]');
  await page.click('[data-testid="nav-logout"]');
  await expect(page.locator('[data-testid="nav-login"]')).toBeVisible();
});
