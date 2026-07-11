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
