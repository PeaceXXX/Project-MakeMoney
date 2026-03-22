import { test, expect } from '@playwright/test';
import { Page } from '@playwright/test';

test.describe('Market Data Page', () => {
  let page: Page;

  test.beforeEach(async ({ page }) => {
    await page.goto('/market');
  });

  test('should display market overview tab', async ({ page }) => {
    await expect(page.locator('text=Market Data')).toBeVisible();
    await expect(page.locator('text=Market Overview')).toBeVisible();
    await expect(page.locator('text=All Stocks')).toBeVisible();
    await expect(page.locator('text=Sector Performance')).toBeVisible();
    await expect(page.locator('text=Market Breadth')).toBeVisible();
  });

  test('should navigate to all stocks tab', async ({ page }) => {
    await page.click('text=All Stocks');
    await expect(page.locator('text=All Stocks Grid')).toBeVisible();
    await expect(page.locator('text=Market Data')).toBeVisible();
  });

  test('should search for stocks', async ({ page }) => {
    await page.fill('input[placeholder="Search stocks..."]');
    await page.fill('AAPL');
    await page.press('Enter');
    await expect(page.locator('text=AAPL')).toBeVisible();
  });

  test('should filter by sector', async ({ page }) => {
    await page.click('text=All Stocks');
    await page.selectOption({ label: 'Technology' });
    await expect(page.locator('text=Technology')).toBeVisible();
  });
});
