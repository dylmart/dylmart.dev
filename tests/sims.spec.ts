import { test, expect } from '@playwright/test';

test.describe('accessibility', () => {
  test('canvas2d sims do not autoplay under reduced motion', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/projects/sims/pi-collisions/');
    await expect(page.locator('.sim2d [data-act="toggle"]')).toHaveText(/play/i);
    const canvas = page.locator('.sim2d .sim-main');
    const a = await canvas.screenshot();
    await page.waitForTimeout(600);
    expect((await canvas.screenshot()).equals(a)).toBe(true); // static until Play
    await ctx.close();
  });

  test('privacy sweep covers sim pages', async ({ page }) => {
    for (const route of ['/projects/sims/', '/projects/sims/pi-collisions/', '/projects/sims/straight-wire/']) {
      await page.goto(route);
      const html = (await page.content()).toLowerCase();
      expect(html).not.toContain('mailto:');
      expect(html).not.toContain('tel:');
    }
  });
});

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

test.describe('2d-motion (ported to Canvas2D)', () => {
  test('sim canvas is visible with working controls, no unavailable message, no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto('/projects/sims/2d-motion/');
    await expect(page.locator('.sim-unavailable')).toBeHidden();
    await expect(page.locator('.sim2d .sim-main')).toBeVisible();
    await expect(page.locator('.sim-controls')).toBeVisible();
    await expect(page.locator('[data-act="toggle"]')).toBeVisible();
    await expect(page.locator('[data-act="reset"]')).toBeVisible();
    await expect(page.locator('[data-act="speed"]')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('2d-motion canvas animates', async ({ page }) => {
    await page.goto('/projects/sims/2d-motion/');
    const canvas = page.locator('.sim2d .sim-main');
    await expect(canvas).toBeVisible();
    const snap = () => canvas.screenshot().then((b) => b.toString('base64'));
    const a = await snap();
    await page.waitForTimeout(700);
    expect(await snap()).not.toBe(a); // pixels changed => sim is running
  });
});

test.describe('gravitation-2point (ported to Canvas2D)', () => {
  test('sim canvas is visible with working controls, no unavailable message, no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto('/projects/sims/gravitation-2point/');
    await expect(page.locator('.sim-unavailable')).toBeHidden();
    await expect(page.locator('.sim2d .sim-main')).toBeVisible();
    await expect(page.locator('.sim-controls')).toBeVisible();
    await expect(page.locator('[data-act="toggle"]')).toBeVisible();
    await expect(page.locator('[data-act="reset"]')).toBeVisible();
    await expect(page.locator('[data-act="speed"]')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('gravitation-2point canvas animates', async ({ page }) => {
    await page.goto('/projects/sims/gravitation-2point/');
    const canvas = page.locator('.sim2d .sim-main');
    await expect(canvas).toBeVisible();
    const snap = () => canvas.screenshot().then((b) => b.toString('base64'));
    const a = await snap();
    await page.waitForTimeout(700);
    expect(await snap()).not.toBe(a); // pixels changed => sim is running
  });
});

test.describe('rope-oscillations-sim (ported to Canvas2D)', () => {
  test('sim canvas is visible with working controls, no unavailable message, no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto('/projects/sims/rope-oscillations-sim/');
    await expect(page.locator('.sim-unavailable')).toBeHidden();
    await expect(page.locator('.sim2d .sim-main')).toBeVisible();
    await expect(page.locator('.sim-controls')).toBeVisible();
    await expect(page.locator('[data-act="toggle"]')).toBeVisible();
    await expect(page.locator('[data-act="reset"]')).toBeVisible();
    await expect(page.locator('[data-act="speed"]')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('rope-oscillations-sim canvas animates', async ({ page }) => {
    await page.goto('/projects/sims/rope-oscillations-sim/');
    const canvas = page.locator('.sim2d .sim-main');
    await expect(canvas).toBeVisible();
    const snap = () => canvas.screenshot().then((b) => b.toString('base64'));
    const a = await snap();
    await page.waitForTimeout(700);
    expect(await snap()).not.toBe(a); // pixels changed => sim is running
  });
});

test.describe('yoyo-lab3 (ported to Canvas2D)', () => {
  // This is the fifth and final canvas2d port; the "registry not yet fully
  // populated" degradation block that used to live here (unavailable-message
  // assertions, plus soft-nav / no-console-error checks against the degraded
  // yoyo-lab3 page) no longer has any un-ported slug to exercise and has been
  // removed. Its regression value is folded in below, now exercised against
  // the real, running sim instead of the placeholder message.
  test('sim canvas is visible with working controls, no unavailable message, no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto('/projects/sims/yoyo-lab3/');
    await expect(page.locator('.sim-unavailable')).toBeHidden();
    await expect(page.locator('.sim2d .sim-main')).toBeVisible();
    await expect(page.locator('.sim-controls')).toBeVisible();
    await expect(page.locator('[data-act="toggle"]')).toBeVisible();
    await expect(page.locator('[data-act="reset"]')).toBeVisible();
    await expect(page.locator('[data-act="speed"]')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('yoyo-lab3 canvas animates', async ({ page }) => {
    await page.goto('/projects/sims/yoyo-lab3/');
    const canvas = page.locator('.sim2d .sim-main');
    await expect(canvas).toBeVisible();
    const snap = () => canvas.screenshot().then((b) => b.toString('base64'));
    const a = await snap();
    await page.waitForTimeout(700);
    expect(await snap()).not.toBe(a); // pixels changed => sim is running
  });

  test('soft-navigating away from a running canvas2d sim page still works normally', async ({ page }) => {
    // Formerly this exercised soft-nav away from the *un-ported* (degraded)
    // yoyo-lab3 page, which never had a canvas or a running requestAnimationFrame
    // loop to unwind. Now that yoyo-lab3 is a real, auto-playing canvas2d sim,
    // this is the meaningful version of that check: it confirms host.ts's RAF
    // loop tears itself down (via the `canvas.isConnected` guard in host.ts's
    // frame()) instead of forcing a full page reload, the way heavy glowscript
    // sims do.
    await page.goto('/projects/sims/yoyo-lab3/');
    await expect(page.locator('.sim2d .sim-main')).toBeVisible();

    await page.evaluate(() => {
      (window as any).__softNavMarker = 1;
    });

    await page.getByRole('link', { name: /all simulations/i }).click();
    await expect(page).toHaveURL(/\/projects\/sims\/?$/);
    await expect(page.locator('.sim-card')).toHaveCount(13);
    expect(await page.evaluate(() => (window as any).__softNavMarker)).toBe(1);
  });
});
