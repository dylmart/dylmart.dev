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

  test('orbit renders behind the planet on top, in front on bottom', async ({ page }) => {
    await page.goto('/');
    const s = await page.evaluate(() => {
      const kids = [...document.querySelector('.art')!.children].map((el) => el.className);
      const front = document.querySelector('.ring.front')!;
      return {
        kids,
        clip: getComputedStyle(front).clipPath,
        inert: getComputedStyle(front).pointerEvents,
      };
    });
    // paint order for positioned siblings IS DOM order:
    expect(s.kids[0], 'full orbit paints first (behind planet)').toContain('ring back');
    expect(s.kids[1], 'planet covers the back arc').toContain('planet');
    expect(s.kids[2], 'clipped copy paints last (over planet)').toContain('ring front');
    expect(s.clip, 'front copy shows only the near half').toContain('inset');
    expect(s.inert, 'decorative art must not intercept taps').toBe('none');
  });

  test('reduced motion: orbiter animation is effectively off', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/');
    const dur = await page.locator('.ring.back .orbit-spin').evaluate((el) => getComputedStyle(el).animationDuration);
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
    await expect(page.locator('html')).toHaveClass(/js/);
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

test.describe('mobile', () => {
  const phone = { viewport: { width: 390, height: 844 } };

  test('no horizontal overflow on any route', async ({ browser }) => {
    const ctx = await browser.newContext(phone);
    const page = await ctx.newPage();
    for (const route of ['/', '/about', '/projects', '/photos', '/blog']) {
      await page.goto(route);
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth, `${route} overflows horizontally`).toBeLessThanOrEqual(clientWidth);
    }
    await ctx.close();
  });

  test('nav links and theme toggle are on screen', async ({ browser }) => {
    const ctx = await browser.newContext(phone);
    const page = await ctx.newPage();
    await page.goto('/');
    for (const label of ['Projects', 'Photos', 'Blog', 'About']) {
      const box = await page.locator('nav .links a', { hasText: label }).boundingBox();
      expect(box, `${label} link not rendered`).not.toBeNull();
      expect(box!.x + box!.width, `${label} link off screen`).toBeLessThanOrEqual(phone.viewport.width);
    }
    const toggle = await page.getByRole('button', { name: 'Toggle theme' }).boundingBox();
    expect(toggle, 'toggle not rendered').not.toBeNull();
    expect(toggle!.x + toggle!.width, 'toggle off screen').toBeLessThanOrEqual(phone.viewport.width);
    await ctx.close();
  });

  test('hero art pieces stay concentric at phone width', async ({ browser }) => {
    const ctx = await browser.newContext(phone);
    const page = await ctx.newPage();
    await page.goto('/');
    const centers = await page.evaluate(() => {
      const center = (sel: string) => {
        const r = document.querySelector(sel)!.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      };
      return { planet: center('.planet'), ring: center('.ring'), orbiter: center('.orbiter') };
    });
    for (const piece of ['ring', 'orbiter'] as const) {
      expect(Math.abs(centers[piece].x - centers.planet.x), `${piece} x-center drift`).toBeLessThanOrEqual(8);
      expect(Math.abs(centers[piece].y - centers.planet.y), `${piece} y-center drift`).toBeLessThanOrEqual(8);
    }
    await ctx.close();
  });
});
