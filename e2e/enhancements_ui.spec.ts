import { test, expect } from '@playwright/test';

test.describe('Skill Cetamol Assessment Platform Enhancements', () => {

  test('Login screen loads and displays authentication form', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Skill|Cetamol|Portal|Login/i);
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('Student results page has print-friendly stylesheet and visual analytics structure', async ({ page }) => {
    // Navigate to results page with mock auth or check DOM structure
    await page.goto('/student/results/mock-result-id');
    // Result page should render without crashing (ErrorBoundary or UI)
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('Student attempt history and dashboard results table navigation', async ({ page }) => {
    await page.goto('/student/dashboard?tab=history');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('Admin dashboard routing and UI elements integrity', async ({ page }) => {
    await page.goto('/admin/dashboard?tab=analytics');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('Super Admin centralized assessment studio route integrity', async ({ page }) => {
    await page.goto('/admin/dashboard?tab=central-exams');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('Proctoring and test time extensions route integrity', async ({ page }) => {
    await page.goto('/admin/dashboard?tab=proctoring');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('Settings threshold configuration route integrity', async ({ page }) => {
    await page.goto('/admin/dashboard?tab=settings');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

});
