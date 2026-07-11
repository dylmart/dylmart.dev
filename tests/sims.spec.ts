import { test, expect } from '@playwright/test';

test.describe('sims section', () => {
  test('index lists exactly the 13 published sims', async ({ page }) => {
    await page.goto('/projects/sims/');
    await expect(page.locator('.sim-card')).toHaveCount(13);
    await expect(page.locator('.sim-card', { hasText: 'Pi Collisions' })).toBeVisible();
  });

  test('unpublished sims have no page', async ({ page }) => {
    const res = await page.goto('/projects/sims/arrow-test/');
    expect(res?.status()).toBe(404);
  });

  test('glowscript sim boots on click', async ({ page }) => {
    await page.goto('/projects/sims/particle-in-a-bottle/');
    await expect(page.locator('#glowscript, .glowscript')).toHaveCount(0); // nothing heavy pre-click
    await page.getByRole('button', { name: /run simulation/i }).click();
    await expect(page.locator('.glowscript canvas').first()).toBeVisible({ timeout: 15000 });
  });

  test('view-source shows original VPython', async ({ page }) => {
    await page.goto('/projects/sims/straight-wire/');
    await page.locator('details.sim-source summary').click();
    await expect(page.locator('details.sim-source')).toContainText('Web VPython 3.2');
  });

  test('projects page links to sims', async ({ page }) => {
    await page.goto('/projects/');
    await page.getByRole('link', { name: /physics simulations/i }).click();
    await expect(page).toHaveURL(/\/projects\/sims/);
  });

  test('booting a sim forces a full reload on next navigation (no orphaned render loop)', async ({ page }) => {
    await page.goto('/projects/sims/particle-in-a-bottle/');
    await page.getByRole('button', { name: /run simulation/i }).click();
    await expect(page.locator('.glowscript canvas').first()).toBeVisible({ timeout: 15000 });

    // Mark this `window` instance. A soft (client-side) navigation keeps
    // `window` alive, so the marker would survive; a full page load creates
    // a fresh `window` and wipes it.
    await page.evaluate(() => {
      (window as any).__softNavMarker = 1;
    });

    await page.getByRole('link', { name: /all simulations/i }).click();
    await expect(page).toHaveURL(/\/projects\/sims\/?$/);
    await expect(page.locator('.sim-card')).toHaveCount(13); // index actually loaded
    expect(await page.evaluate(() => (window as any).__softNavMarker)).toBeUndefined();
  });

  test('a sim page where Run was never clicked still soft-navigates normally', async ({ page }) => {
    await page.goto('/projects/sims/particle-in-a-bottle/');

    await page.evaluate(() => {
      (window as any).__softNavMarker = 1;
    });

    await page.getByRole('link', { name: /all simulations/i }).click();
    await expect(page).toHaveURL(/\/projects\/sims\/?$/);
    await expect(page.locator('.sim-card')).toHaveCount(13);
    expect(await page.evaluate(() => (window as any).__softNavMarker)).toBe(1);
  });
});

test.describe('canvas2d sims (registry not yet fully populated)', () => {
  const unportedSlugs = ['2d-motion', 'rope-oscillations-sim', 'gravitation-2point', 'yoyo-lab3'];

  for (const slug of unportedSlugs) {
    test(`${slug} degrades to a clear unavailable message, no dead canvas or controls`, async ({ page }) => {
      await page.goto(`/projects/sims/${slug}/`);
      await expect(page.locator('.sim-unavailable')).toBeVisible();
      await expect(page.locator('.sim-unavailable')).toContainText(/not yet available/i);
      await expect(page.locator('.sim2d canvas')).toHaveCount(0);
      await expect(page.locator('.sim-controls')).toHaveCount(0);
    });
  }

  test('soft-navigating away from an un-ported canvas2d page still works normally', async ({ page }) => {
    await page.goto('/projects/sims/2d-motion/');
    await expect(page.locator('.sim-unavailable')).toBeVisible();

    await page.evaluate(() => {
      (window as any).__softNavMarker = 1;
    });

    await page.getByRole('link', { name: /all simulations/i }).click();
    await expect(page).toHaveURL(/\/projects\/sims\/?$/);
    await expect(page.locator('.sim-card')).toHaveCount(13);
    expect(await page.evaluate(() => (window as any).__softNavMarker)).toBe(1);
  });

  test('no console errors while landing on an un-ported canvas2d page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto('/projects/sims/2d-motion/');
    await expect(page.locator('.sim-unavailable')).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('pi-collisions (ported to Canvas2D)', () => {
  test('sim canvas is visible with working controls, no unavailable message, no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto('/projects/sims/pi-collisions/');
    await expect(page.locator('.sim-unavailable')).toBeHidden();
    await expect(page.locator('.sim2d .sim-main')).toBeVisible();
    await expect(page.locator('.sim-controls')).toBeVisible();
    await expect(page.locator('[data-act="toggle"]')).toBeVisible();
    await expect(page.locator('[data-act="reset"]')).toBeVisible();
    await expect(page.locator('[data-act="speed"]')).toBeVisible();
    await expect(page.locator('.sim-params select')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('pi-collisions canvas animates', async ({ page }) => {
    await page.goto('/projects/sims/pi-collisions/');
    const canvas = page.locator('.sim2d .sim-main');
    await expect(canvas).toBeVisible();
    const snap = () => canvas.screenshot().then((b) => b.toString('base64'));
    const a = await snap();
    await page.waitForTimeout(700);
    expect(await snap()).not.toBe(a); // pixels changed => sim is running
  });
});
