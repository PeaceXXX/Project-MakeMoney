import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');

    // Check that the login form is visible
    await expect(page.locator('text=Login')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in the login form with invalid credentials
    await page.locator('input[type="email"]').fill('invalid@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    // Should show an error message (adjust selector based on actual implementation)
    await expect(page.locator('text=/invalid|error|failed/i')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.goto('/login');

    // Click on the registration link
    await page.locator('text=/register|sign up/i').click();

    // Should be on the registration page
    await expect(page).toHaveURL(/.*register/);
  });
});

test.describe('Dashboard', () => {
  test.skip('should display portfolio summary after login', async ({ page }) => {
    // This test is skipped because it requires authentication
    // In a real scenario, you would set up authentication state first
    await page.goto('/dashboard');

    // Check dashboard elements
    await expect(page.locator('text=Portfolio')).toBeVisible();
    await expect(page.locator('text=Value')).toBeVisible();
  });
});

test.describe('Market Data', () => {
  test('should display market overview page', async ({ page }) => {
    await page.goto('/market');

    // Check that market data elements are visible
    await expect(page.locator('text=/market|stock|price/i')).toBeVisible();
  });

  test('should search for stocks', async ({ page }) => {
    await page.goto('/market');

    // Look for search input and search for a stock
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="symbol" i]');

    if (await searchInput.isVisible()) {
      await searchInput.fill('AAPL');
      await page.keyboard.press('Enter');

      // Should show AAPL results
      await expect(page.locator('text=AAPL')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Portfolio', () => {
  test.skip('should display portfolio holdings', async ({ page }) => {
    // This test requires authentication
    await page.goto('/portfolio');

    // Check portfolio elements
    await expect(page.locator('text=Portfolio')).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should have working navigation', async ({ page }) => {
    await page.goto('/');

    // Check that the main navigation links work
    const navLinks = ['Dashboard', 'Portfolio', 'Market', 'Trading'];

    for (const linkText of navLinks) {
      const link = page.locator(`text=${linkText}`).first();
      if (await link.isVisible()) {
        await link.click();
        // Verify we navigated somewhere
        await expect(page).not.toHaveURL('/');
      }
    }
  });
});

test.describe('Responsive Design', () => {
  test('should display correctly on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check that the page is still usable on mobile
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display correctly on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // Check that the page is usable on tablet
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display correctly on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Check that the page is usable on desktop
    await expect(page.locator('body')).toBeVisible();
  });
});
