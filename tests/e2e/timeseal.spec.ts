import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8788';

test.describe('TimeSeal E2E Tests', () => {

  test('should load homepage and display main elements', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('h1', { hasText: 'TIME-SEAL' })).toBeVisible();
    await expect(page.locator('text=QUICK START TEMPLATES')).toBeVisible();
  });





  test('should apply template and populate form', async ({ page }) => {
    await page.goto(BASE_URL);

    // Click Crypto Inheritance template
    await page.click('button[title="Crypto Inheritance"]');

    // Verify form is populated
    const messageValue = await page.inputValue('textarea#message-input');
    expect(messageValue).toContain('Seed phrase');

    // Verify dead man's switch is selected
    await expect(page.locator('button:has-text("DEAD MAN\'S SWITCH")')).toHaveClass(/bg-neon-green/);

    // Verify pulse interval is set to 30 days
    const pulseDays = await page.inputValue('input#pulse-days');
    expect(pulseDays).toBe('30');
  });

  test('should handle file upload', async ({ page }) => {
    await page.goto(BASE_URL);

    // Create a test file
    const fileContent = 'This is a test file content';
    const buffer = Buffer.from(fileContent);

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: buffer,
    });

    // Verify file is shown
    await expect(page.getByText('📎 test.txt')).toBeVisible();

    // Verify message input is disabled
    await expect(page.locator('textarea#message-input')).toBeDisabled();
  });

  test('should navigate to info pages', async ({ page }) => {
    // Test How It Works page
    await page.goto(`${BASE_URL}/how-it-works`);
    await expect(page.locator('h1', { hasText: 'HOW IT WORKS' })).toBeVisible();
    await expect(page.locator('text=Layer 1: The Vault')).toBeVisible();

    // Test Security page
    await page.goto(`${BASE_URL}/security`);
    await expect(page.locator('h1', { hasText: 'SECURITY' })).toBeVisible();
    await expect(page.locator('text=AES-GCM 256-bit')).toBeVisible();

    // Test FAQ page
    await page.goto(`${BASE_URL}/faq`);
    await expect(page.locator('h1', { hasText: 'FAQ' })).toBeVisible();
    await expect(page.locator('text=What is the maximum file size?')).toBeVisible();
  });

  test('should validate form inputs', async ({ page }) => {
    await page.goto(BASE_URL);

    // Try to create seal without message
    await page.click('button:has-text("TIMED RELEASE")');

    // Button should be disabled
    const createButton = page.locator('button:has-text("CREATE TIME-SEAL")');
    await expect(createButton).toBeDisabled();

    // Add message
    await page.fill('textarea#message-input', 'Test');

    // Button still disabled (no unlock time)
    await expect(createButton).toBeDisabled();

    // Set unlock time
    const future = new Date();
    future.setMinutes(future.getMinutes() + 5);
    const fYear = future.getFullYear();
    const fMonth = String(future.getMonth() + 1).padStart(2, '0');
    const fDay = String(future.getDate()).padStart(2, '0');
    const fHours = String(future.getHours()).padStart(2, '0');
    const fMinutes = String(future.getMinutes()).padStart(2, '0');
    const fDateString = `${fYear}-${fMonth}-${fDay}T${fHours}:${fMinutes}`;
    await page.fill('input[type="datetime-local"]', fDateString);

    // Button should be enabled (Turnstile bypassed in E2E)
    await expect(createButton).toBeEnabled();
  });

  test('should display footer with links', async ({ page }) => {
    await page.goto(BASE_URL);

    // Check footer exists
    await expect(page.locator('footer')).toBeVisible();

    // Check footer links
    await expect(page.locator('footer a:has-text("How It Works")')).toBeVisible();
    await expect(page.locator('footer a:has-text("Security")')).toBeVisible();
    await expect(page.locator('footer a:has-text("FAQ")')).toBeVisible();

    // Check social icons
    await expect(page.locator('footer a[aria-label="GitHub"]')).toBeVisible();
  });


});

test.describe('API Health Checks', () => {
  test('should have healthy API endpoints', async ({ request }) => {
    const healthResponse = await request.get(`${BASE_URL}/api/health`);
    expect(healthResponse.ok()).toBeTruthy();

    const metricsResponse = await request.get(`${BASE_URL}/api/metrics`);
    expect(metricsResponse.ok()).toBeTruthy();
  });
});
