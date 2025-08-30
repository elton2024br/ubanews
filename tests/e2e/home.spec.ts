import { test, expect } from '@playwright/test';

test('home page displays main content', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#main-content')).toBeVisible();
});
