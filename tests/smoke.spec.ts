import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Optional, gitignored file of extra regex-source strings for the privacy
// sweep below. Lets local runs guard real personal data without committing
// it to this public repo. Absent in CI/fresh clones — generic checks still run.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const privacyPatternsPath = path.join(__dirname, '..', 'privacy-patterns.json');
const extraPrivacyPatterns: string[] = fs.existsSync(privacyPatternsPath)
  ? JSON.parse(fs.readFileSync(privacyPatternsPath, 'utf-8'))
  : [];

test.describe('theme', () => {
  test('defaults to dark when system prefers dark', async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: 'dark' });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await ctx.close();
  });

  test('defaults to light when system prefers light', async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: 'light' });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await ctx.close();
  });

  test('toggle flips theme and persists across reload', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    const initial = await html.getAttribute('data-theme');
    await page.getByRole('button', { name: 'Toggle theme' }).click();
    const flipped = initial === 'dark' ? 'light' : 'dark';
    await expect(html).toHaveAttribute('data-theme', flipped);
    await page.reload();
    await expect(html).toHaveAttribute('data-theme', flipped);
  });
});

test.describe('hero', () => {
  test('renders name and HUD line', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero h1')).toContainText(/Dylan\s*Martin/);
    await expect(page.locator('.hero .hud')).toContainText('SLO GROUND STATION');
  });

  test('reduced motion: orbiter animation is effectively off', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/');
    const dur = await page.locator('.orbiter').evaluate((el) => getComputedStyle(el).animationDuration);
    expect(parseFloat(dur)).toBeLessThan(0.01);
    await ctx.close();
  });
});

test.describe('routes', () => {
  test('all section routes render with nav', async ({ page }) => {
    for (const path of ['/about', '/projects', '/photos', '/blog']) {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator('nav .wordmark')).toHaveText('dylmart_');
    }
  });

  test('404 page is on brand', async ({ page }) => {
    const res = await page.goto('/definitely-not-a-page');
    expect(res?.status()).toBe(404);
    await expect(page.locator('main')).toContainText(/lost in space/i);
    await expect(page.locator('main a[href="/"]')).toBeVisible();
  });

  test('theme toggle works after client-side navigation', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav .links a[href="/about"]').click();
    await expect(page).toHaveURL(/\/about/);
    const html = page.locator('html');
    const before = await html.getAttribute('data-theme');
    await page.getByRole('button', { name: 'Toggle theme' }).click();
    const expected = before === 'dark' ? 'light' : 'dark';
    await expect(html).toHaveAttribute('data-theme', expected);
  });
});

test.describe('chrome', () => {
  test('nav has wordmark and section links', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav .wordmark')).toHaveText('dylmart_');
    for (const label of ['Projects', 'Photos', 'Blog', 'About']) {
      await expect(page.locator('nav')).toContainText(label);
    }
  });

  test('footer has exactly the two identity links', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer a[href="https://github.com/dylmart"]')).toBeVisible();
    await expect(page.locator('footer a[href*="linkedin.com/in/dylan-martin"]')).toBeVisible();
  });

  test('privacy: no email, phone, or resume leaks anywhere', async ({ page }) => {
    for (const route of ['/', '/about', '/projects', '/photos', '/blog', '/definitely-not-a-page']) {
      await page.goto(route);
      const html = (await page.content()).toLowerCase();
      expect(html).not.toContain('mailto:');
      expect(html).not.toContain('tel:');
      expect(html).not.toContain('resume');
      for (const pattern of extraPrivacyPatterns) {
        expect(html).not.toMatch(new RegExp(pattern, 'i'));
      }
    }
  });
});
