import { test, expect } from '@playwright/test';

test('admin login page loads', async ({ page }) => {
  await page.goto('/admin/login');
  await expect(page.locator('h1, h2, h3')).toContainText(/login/i);
});
