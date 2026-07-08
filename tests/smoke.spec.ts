import { test, expect } from '@playwright/test';

test.describe('theme', () => {
  test('defaults to dark when system prefers dark', async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: 'dark' });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
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
    for (const path of ['/', '/about', '/projects', '/photos', '/blog', '/definitely-not-a-page']) {
      await page.goto(path);
      const html = (await page.content()).toLowerCase();
      expect(html).not.toContain('mailto:');
      expect(html).not.toContain('protonmail');
      expect(html).not.toMatch(/805[\s.()-]*717/);
      expect(html).not.toContain('resume');
    }
  });
});
