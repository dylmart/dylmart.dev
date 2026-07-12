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
    for (const route of ['/projects/sims/', '/projects/sims/pi-collisions/', '/projects/sims/many-particles-in-bottle/']) {
      await page.goto(route);
      const html = (await page.content()).toLowerCase();
      expect(html).not.toContain('mailto:');
      expect(html).not.toContain('tel:');
    }
  });
});

test.describe('sims section', () => {
  test('index lists exactly the 10 published sims', async ({ page }) => {
    await page.goto('/projects/sims/');
    await expect(page.locator('.sim-card')).toHaveCount(10);
    await expect(page.locator('.sim-card', { hasText: 'Counting π with Colliding Blocks' })).toBeVisible();
  });

  test('unpublished sims have no page', async ({ page }) => {
    const res = await page.goto('/projects/sims/arrow-test/');
    expect(res?.status()).toBe(404);
  });

  test('glowscript sim boots on click', async ({ page }) => {
    await page.goto('/projects/sims/many-particles-in-bottle/');
    await expect(page.locator('#glowscript, .glowscript')).toHaveCount(0); // nothing heavy pre-click
    await page.getByRole('button', { name: /run simulation/i }).click();
    await expect(page.locator('.glowscript canvas').first()).toBeVisible({ timeout: 15000 });
  });

  test('booting a glowscript sim does not restyle the page (ide.css leak)', async ({ page }) => {
    // Regression: loading upstream ide.css injected bare `body { background; font }`
    // rules that repainted the whole site once a sim was run.
    await page.goto('/projects/sims/many-particles-in-bottle/');
    const before = await page.evaluate(() => {
      const s = getComputedStyle(document.body);
      return { bg: s.backgroundColor, font: s.fontFamily, size: s.fontSize };
    });
    await page.getByRole('button', { name: /run simulation/i }).click();
    await expect(page.locator('.glowscript canvas').first()).toBeVisible({ timeout: 15000 });
    const after = await page.evaluate(() => {
      const s = getComputedStyle(document.body);
      return { bg: s.backgroundColor, font: s.fontFamily, size: s.fontSize };
    });
    expect(after).toEqual(before);
  });

  test('glowscript print() console docks inside the sim stage, not at body end', async ({ page }) => {
    await page.goto('/projects/sims/many-particles-in-bottle/');
    await page.getByRole('button', { name: /run simulation/i }).click();
    await expect(page.locator('.glowscript canvas').first()).toBeVisible({ timeout: 15000 });
    // GlowScript creates the console lazily on the sim's first print() —
    // real sim-time that software WebGL may never reach in CI, so instead of
    // waiting for the sim we inject the exact structure the runtime appends
    // (glow.3.2 print defaults: place $("body"), a wrapper div around
    // textarea#print) and assert the stage's observer docks it.
    await page.evaluate(() => {
      const wrap = document.createElement('div');
      const ta = document.createElement('textarea');
      ta.id = 'print';
      wrap.appendChild(ta);
      document.body.appendChild(wrap);
    });
    await expect(page.locator('.sim-stage .sim-print #print')).toBeAttached({ timeout: 5000 });
    expect(await page.evaluate(() => document.querySelectorAll('#print').length)).toBe(1);
  });

  test('view-source shows original VPython', async ({ page }) => {
    await page.goto('/projects/sims/many-particles-in-bottle/');
    await page.locator('details.sim-source summary').click();
    await expect(page.locator('details.sim-source')).toContainText('Web VPython 3.2');
  });

  test('mobile disclaimer shows on touch devices only for 3D sims', async ({ page, browser }) => {
    // desktop (fine pointer): hidden
    await page.goto('/projects/sims/many-particles-in-bottle/');
    await expect(page.locator('.sim-mobile-warn')).toBeHidden();
    // coarse pointer (phone): visible
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true,
    });
    const phone = await ctx.newPage();
    await phone.goto('/projects/sims/many-particles-in-bottle/');
    await expect(phone.locator('.sim-mobile-warn')).toBeVisible();
    await expect(phone.locator('.sim-mobile-warn')).toContainText("DON'T WORK ON MOBILE");
    await ctx.close();
  });

  test('projects page links to sims', async ({ page }) => {
    await page.goto('/projects/');
    await page.getByRole('link', { name: /physics simulations/i }).click();
    await expect(page).toHaveURL(/\/projects\/sims/);
  });

  test('booting a sim forces a full reload on next navigation (no orphaned render loop)', async ({ page }) => {
    await page.goto('/projects/sims/many-particles-in-bottle/');
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
    await expect(page.locator('.sim-card')).toHaveCount(10); // index actually loaded
    expect(await page.evaluate(() => (window as any).__softNavMarker)).toBeUndefined();
  });

  test('a sim page where Run was never clicked still soft-navigates normally', async ({ page }) => {
    await page.goto('/projects/sims/many-particles-in-bottle/');

    await page.evaluate(() => {
      (window as any).__softNavMarker = 1;
    });

    await page.getByRole('link', { name: /all simulations/i }).click();
    await expect(page).toHaveURL(/\/projects\/sims\/?$/);
    await expect(page.locator('.sim-card')).toHaveCount(10);
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
    await expect(page.locator('.sim2d .sim-plot')).toHaveCount(0); // graph cut per Dylan
    await expect(page.locator('.sim-params input[type="number"]')).toHaveCount(3); // v0x, v0y, ay
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

  test('changing a launch param (v0y) rebuilds the sim and it still animates', async ({ page }) => {
    await page.goto('/projects/sims/2d-motion/');
    const canvas = page.locator('.sim2d .sim-main');
    await expect(canvas).toBeVisible();
    const inputs = page.locator('.sim-params input[type="number"]');
    await expect(inputs).toHaveCount(3); // v0x, v0y, ay
    const v0yInput = page.locator('.sim-params input[data-key="v0y"]');
    await v0yInput.fill('8'); // v0y: 5 -> 8
    await v0yInput.dispatchEvent('change');
    // a param change pauses and rebuilds the sim (fresh instance), so it
    // needs an explicit Play click to resume animating.
    await page.locator('[data-act="toggle"]').click();
    const snap = () => canvas.screenshot().then((b) => b.toString('base64'));
    const a = await snap();
    await page.waitForTimeout(700);
    expect(await snap()).not.toBe(a); // pixels changed => sim is running with the new param
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

test.describe('gravitation-2point-gs (WebGL original, vendored textures)', () => {
  test('glowscript sim boots on click', async ({ page }) => {
    await page.goto('/projects/sims/gravitation-2point-gs/');
    await expect(page.locator('#glowscript, .glowscript')).toHaveCount(0); // nothing heavy pre-click
    await page.getByRole('button', { name: /run simulation/i }).click();
    await expect(page.locator('.glowscript canvas').first()).toBeVisible({ timeout: 15000 });
  });

  test('booting the sim makes no request to a non-local host (planet textures are vendored)', async ({ page }) => {
    await page.goto('/projects/sims/gravitation-2point-gs/');
    const externalRequests: string[] = [];
    page.on('request', (req) => {
      const host = new URL(req.url()).hostname;
      if (host !== '127.0.0.1' && host !== 'localhost') externalRequests.push(req.url());
    });

    await page.getByRole('button', { name: /run simulation/i }).click();
    await expect(page.locator('.glowscript canvas').first()).toBeVisible({ timeout: 15000 });
    // Textures load asynchronously as the sim boots (scene.waitfor("textures"));
    // give them a moment to fire after the canvas itself appears.
    await page.waitForTimeout(1000);

    expect(externalRequests).toEqual([]);
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
    await expect(page.locator('.sim-card')).toHaveCount(10);
    expect(await page.evaluate(() => (window as any).__softNavMarker)).toBe(1);
  });
});

test.describe('electric-field-array (ported to Canvas2D, draggable charges)', () => {
  test('sim canvas is visible with working controls, no unavailable message, no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto('/projects/sims/electric-field-array/');
    await expect(page.locator('.sim-unavailable')).toBeHidden();
    await expect(page.locator('.sim2d .sim-main')).toBeVisible();
    await expect(page.locator('.sim-controls')).toBeVisible();
    await expect(page.locator('[data-act="toggle"]')).toBeVisible();
    await expect(page.locator('[data-act="reset"]')).toBeVisible();
    await expect(page.locator('[data-act="speed"]')).toHaveCount(0); // static sim opts out of speed
    await expect(page.locator('.sim2d .sim-plot')).toHaveCount(0); // static field has no plot
    expect(errors).toEqual([]);
  });

  test('drag-to-aim then soft-nav away and back boots clean (no leaked pointer state)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto('/projects/sims/2d-motion/');
    const canvas2d = page.locator('.sim2d .sim-main');
    await canvas2d.scrollIntoViewIfNeeded();
    const box = (await canvas2d.boundingBox())!;
    // a short drag on the canvas (aim gesture), then in-app navigation
    await page.mouse.move(box.x + 60, box.y + box.height - 60);
    await page.mouse.down();
    await page.mouse.move(box.x + 120, box.y + box.height - 120, { steps: 5 });
    await page.mouse.up();
    await page.getByRole('link', { name: /all simulations/i }).click();
    await expect(page.locator('.sim-card')).toHaveCount(10);
    await page.locator('.sim-card', { hasText: 'Projectile Motion Playground' }).click();
    await expect(page.locator('.sim2d .sim-main')).toBeVisible();
    // still animates after the round trip
    const snap = () => page.locator('.sim2d .sim-main').screenshot().then((b) => b.toString('base64'));
    const a = await snap();
    await page.waitForTimeout(700);
    expect(await snap()).not.toBe(a);
    expect(errors).toEqual([]);
  });

  test('dragging a charge updates the rendered field while paused', async ({ page }) => {
    await page.goto('/projects/sims/electric-field-array/');
    const canvas = page.locator('.sim2d .sim-main');
    await expect(canvas).toBeVisible();

    // Pause first: the field is static (advance() is a no-op), so pausing
    // guarantees the drag itself is the only possible source of a pixel
    // diff, and it also exercises the host's redraw-while-paused path
    // (onPointer returning true forces an immediate sim.draw even with the
    // RAF loop stopped).
    const toggle = page.locator('[data-act="toggle"]');
    await toggle.click();
    await expect(toggle).toHaveText(/play/i);

    // A canvas .screenshot() call auto-scrolls its target into view, which
    // would otherwise shift the page between measuring boundingBox() and the
    // first screenshot below and throw off every subsequent mouse coordinate.
    // Scrolling once, up front, keeps the box and the mouse math in sync.
    await canvas.scrollIntoViewIfNeeded();

    // Map charge 1's world position (0, 2) to screen px using the same
    // square-aspect mapping electric-field-array.ts uses internally:
    // scale = min(w,h) / 14, origin at canvas center, y flipped.
    const box = (await canvas.boundingBox())!;
    const dims = await canvas.evaluate((el: HTMLCanvasElement) => ({ w: el.clientWidth, h: el.clientHeight }));
    const scale = Math.min(dims.w, dims.h) / 14;
    const chargeX = box.x + dims.w / 2;
    const chargeY = box.y + dims.h / 2 - 2 * scale;

    const before = await canvas.screenshot();
    await page.mouse.move(chargeX, chargeY);
    await page.mouse.down();
    await page.mouse.move(chargeX + 60, chargeY, { steps: 5 });
    await page.mouse.up();
    const after = await canvas.screenshot();
    expect(after.equals(before)).toBe(false);
  });

  test('drag survives a viewport resize (pointer coords stay in mount-time space)', async ({ page }) => {
    // The canvas is CSS width:100%, so a resize/rotation changes its
    // clientWidth/Height, but host.ts captures `view.w/h` once at mount.
    // Pointer events' offsetX/Y arrive in the NEW CSS-px space, so the host
    // must rescale them into the mount-time view before sims hit-test
    // against it, or drags misalign after any resize.
    await page.setViewportSize({ width: 1100, height: 800 });
    await page.goto('/projects/sims/electric-field-array/');
    const canvas = page.locator('.sim2d .sim-main');
    await expect(canvas).toBeVisible();

    const toggle = page.locator('[data-act="toggle"]');
    await toggle.click();
    await expect(toggle).toHaveText(/play/i);

    await canvas.scrollIntoViewIfNeeded();
    const mountDims = await canvas.evaluate((el: HTMLCanvasElement) => ({ w: el.clientWidth, h: el.clientHeight }));
    const mountScale = Math.min(mountDims.w, mountDims.h) / 14;
    // world (3, -2): the positive charge, INITIAL_CHARGES[1] in electric-field-array.ts.
    const pxMount = mountDims.w / 2 + 3 * mountScale;
    const pyMount = mountDims.h / 2 + 2 * mountScale;

    // Resize to a meaningfully different viewport; the mounted sim's `view`
    // (captured once at mount) does not follow.
    await page.setViewportSize({ width: 700, height: 900 });
    await canvas.scrollIntoViewIfNeeded();
    const box = (await canvas.boundingBox())!;
    const dims = await canvas.evaluate((el: HTMLCanvasElement) => ({ w: el.clientWidth, h: el.clientHeight }));

    // Screen offset that lands on the charge in the CURRENT (post-resize)
    // CSS-px space: scale the mount-space pixel by how much the canvas has
    // grown/shrunk since mount, matching what host.ts is expected to invert.
    const chargeX = box.x + pxMount * (dims.w / mountDims.w);
    const chargeY = box.y + pyMount * (dims.h / mountDims.h);

    const before = await canvas.screenshot();
    await page.mouse.move(chargeX, chargeY);
    await page.mouse.down();
    await page.mouse.move(chargeX + 40, chargeY, { steps: 5 });
    await page.mouse.up();
    const after = await canvas.screenshot();
    expect(after.equals(before)).toBe(false);
  });
});

test.describe('orbit-sandbox (native canvas2d)', () => {
  test('sim canvas is visible with working controls, no unavailable message, no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto('/projects/sims/orbit-sandbox/');
    await expect(page.locator('.sim-unavailable')).toBeHidden();
    await expect(page.locator('.sim2d .sim-main')).toBeVisible();
    await expect(page.locator('.sim-controls')).toBeVisible();
    await expect(page.locator('[data-act="toggle"]')).toBeVisible();
    await expect(page.locator('[data-act="reset"]')).toBeVisible();
    await expect(page.locator('[data-act="speed"]')).toBeVisible();
    await expect(page.locator('.sim-params')).toBeEmpty(); // no launch-parameter selects
    await expect(page.locator('.sim2d .sim-plot')).toHaveCount(0); // no plot
    expect(errors).toEqual([]);
  });

  test('orbit-sandbox canvas animates', async ({ page }) => {
    await page.goto('/projects/sims/orbit-sandbox/');
    const canvas = page.locator('.sim2d .sim-main');
    await expect(canvas).toBeVisible();
    const snap = () => canvas.screenshot().then((b) => b.toString('base64'));
    const a = await snap();
    await page.waitForTimeout(700);
    expect(await snap()).not.toBe(a); // pixels changed => the probe is orbiting
  });

  test('clicking an empty area while paused drops a planet', async ({ page }) => {
    await page.goto('/projects/sims/orbit-sandbox/');
    const canvas = page.locator('.sim2d .sim-main');
    await expect(canvas).toBeVisible();

    // Pause first so the drop itself is the only possible source of a pixel
    // diff, and to exercise the host's redraw-while-paused path (onPointer
    // returning true forces an immediate sim.draw even with the RAF loop
    // stopped).
    const toggle = page.locator('[data-act="toggle"]');
    await toggle.click();
    await expect(toggle).toHaveText(/play/i);

    // A canvas .screenshot() call auto-scrolls its target into view, which
    // would otherwise shift the page between measuring boundingBox() and the
    // first screenshot below; scroll once, up front, to keep them in sync.
    await canvas.scrollIntoViewIfNeeded();
    const box = (await canvas.boundingBox())!;

    const before = await canvas.screenshot();
    // Click well away from both the sun (canvas center) and the probe's
    // default position (world (12, 0), right-of-center) so it registers as
    // an empty-area drop rather than a probe drag.
    await page.mouse.click(box.x + box.width * 0.15, box.y + box.height * 0.15);
    const after = await canvas.screenshot();
    expect(after.equals(before)).toBe(false);
  });
});

test.describe('boids-flocking (native canvas2d)', () => {
  test('sim canvas is visible with working controls, no unavailable message, no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto('/projects/sims/boids-flocking/');
    await expect(page.locator('.sim-unavailable')).toBeHidden();
    await expect(page.locator('.sim2d .sim-main')).toBeVisible();
    await expect(page.locator('.sim-controls')).toBeVisible();
    await expect(page.locator('[data-act="toggle"]')).toBeVisible();
    await expect(page.locator('[data-act="reset"]')).toBeVisible();
    await expect(page.locator('[data-act="speed"]')).toBeVisible();
    await expect(page.locator('.sim-params select')).toBeVisible(); // seed select
    await expect(page.locator('.sim2d .sim-plot')).toHaveCount(0); // no plot
    expect(errors).toEqual([]);
  });

  test('boids-flocking canvas animates', async ({ page }) => {
    await page.goto('/projects/sims/boids-flocking/');
    const canvas = page.locator('.sim2d .sim-main');
    await expect(canvas).toBeVisible();
    const snap = () => canvas.screenshot().then((b) => b.toString('base64'));
    const a = await snap();
    await page.waitForTimeout(700);
    expect(await snap()).not.toBe(a); // pixels changed => the flock is moving
  });

  test('a hold-and-move pointer gesture (predator drag) produces no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto('/projects/sims/boids-flocking/');
    const canvas = page.locator('.sim2d .sim-main');
    await expect(canvas).toBeVisible();
    await canvas.scrollIntoViewIfNeeded();
    const box = (await canvas.boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    // Hold on the canvas center (spooking the flock is a visual effect only;
    // flockState isn't reachable from Playwright, so this asserts the engine
    // survives the gesture cleanly rather than pixel-diffing the predator).
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 60, cy + 40, { steps: 8 });
    await page.mouse.move(cx - 40, cy - 20, { steps: 8 });
    await page.mouse.up();

    await expect(canvas).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('native sims', () => {
  // This is the sixth and final canvas2d native sim; the "registry not yet
  // fully populated" degradation loop that used to live here (unavailable-
  // message assertions against un-ported slugs) no longer has any un-ported
  // slug to exercise and has been removed. Billiards-break was later cut by the site owner; its regression
  // coverage went with it.
  test('a native sim page has no glowscript source viewer and credits BUILT NATIVE in the HUD', async ({ page }) => {
    await page.goto('/projects/sims/orbit-sandbox/');
    await expect(page.locator('details.sim-source')).toHaveCount(0);
    await expect(page.locator('p.hud').first()).toContainText('BUILT NATIVE');
  });
});

