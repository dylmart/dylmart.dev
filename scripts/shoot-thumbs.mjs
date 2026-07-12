// Regenerate public/sim-thumbs/<slug>.png from the sims as they render NOW.
//
// Serves the BUILT dist/ over a plain static server, then for each published
// sim (same publish:true + render: frontmatter grep as compile-sims.mjs):
//   - canvas2d: goto the detail page, wait ~1200ms so the autoplaying sim is
//     mid-animation, screenshot .sim2d .sim-main
//   - glowscript: goto the detail page, click "Run simulation", wait for the
//     .glowscript canvas, wait ~4000ms for SwiftShader + texture load, then
//     screenshot the canvas element itself
//
// Usage: node scripts/shoot-thumbs.mjs (expects dist/ to already be built;
// the "shoot:thumbs" npm script runs `astro build` first so it's
// self-sufficient end to end).
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { readdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SIMS_DIR = join(ROOT, 'src/content/sims');
const THUMBS_DIR = join(ROOT, 'public/sim-thumbs');
const DIST_DIR = join(ROOT, 'dist');
const PORT = 4399;
const BASE = `http://127.0.0.1:${PORT}`;

async function publishedSims() {
  const sims = [];
  for (const slug of await readdir(SIMS_DIR)) {
    const md = await readFile(join(SIMS_DIR, slug, 'index.md'), 'utf8').catch(() => null);
    if (!md || !/publish: true/.test(md)) continue;
    const m = md.match(/^render:\s*(\S+)/m);
    if (!m) continue;
    sims.push({ slug, render: m[1] });
  }
  return sims;
}

function waitForServer(url, tries = 50) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      fetch(url)
        .then(() => resolve())
        .catch((err) => {
          if (n <= 0) return reject(err);
          setTimeout(() => attempt(n - 1), 100);
        });
    };
    attempt(tries);
  });
}

async function main() {
  const sims = await publishedSims();
  if (sims.length === 0) throw new Error('no published sims found — is src/content/sims populated?');
  console.log(`found ${sims.length} published sims: ${sims.map((s) => s.slug).join(', ')}`);

  const server = spawn('python3', ['-m', 'http.server', String(PORT), '-d', DIST_DIR, '--bind', '127.0.0.1'], {
    stdio: 'ignore',
  });

  const failures = [];
  let browser;
  try {
    await waitForServer(BASE + '/');
    browser = await chromium.launch();

    for (const { slug, render } of sims) {
      const context = await browser.newContext();
      const page = await context.newPage();
      try {
        await page.goto(`${BASE}/projects/sims/${slug}/`, { waitUntil: 'load' });

        let target;
        if (render === 'glowscript') {
          await page.getByRole('button', { name: /run simulation/i }).click();
          const canvas = page.locator('.glowscript canvas').first();
          await canvas.waitFor({ state: 'visible', timeout: 15000 });
          await page.waitForTimeout(4000); // SwiftShader + texture load (gravitation-2point-gs)
          target = canvas;
        } else {
          // canvas2d (autoplays on mount; electric-field-array is static
          // but the same code path is a no-op-safe plain screenshot)
          target = page.locator('.sim2d .sim-main');
          await target.waitFor({ state: 'visible', timeout: 15000 });
          await page.waitForTimeout(1200);
        }

        await target.scrollIntoViewIfNeeded();
        const buf = await target.screenshot({ path: join(THUMBS_DIR, `${slug}.png`) });
        // Sanity floor: catch genuinely broken/placeholder captures (a 1x1 PNG
        // is ~70 bytes; a blank solid-color 640x400 frame is still well under
        // 1KB). A byte-size-only floor is the wrong tool for THIS dataset —
        // several sims render mostly solid-black backgrounds with a few thin
        // shapes, which PNG compresses down to ~4.4-4.5KB even for a fully
        // legitimate mid-animation frame (verified by eye: gravitation-2point
        // and pi-collisions both come in under 5KB showing correct, current
        // orange/blue content, not empty canvases). So the real gate is the
        // PNG's own IHDR dimensions (catches actual 1x1/degenerate captures)
        // with a generous byte floor only as a belt-and-suspenders backstop.
        if (buf.length < 2 * 1024) throw new Error(`output only ${buf.length} bytes (< 2KB floor)`);
        const width = buf.readUInt32BE(16);
        const height = buf.readUInt32BE(20);
        if (width < 100 || height < 100) throw new Error(`output is ${width}x${height} (looks like a placeholder)`);
        console.log(`captured ${slug} (${buf.length} bytes, ${width}x${height})`);
      } catch (err) {
        console.error(`FAILED ${slug}: ${err.message}`);
        failures.push(slug);
      } finally {
        await context.close();
      }
    }

    // Prune orphaned thumbnails for slugs that are no longer published.
    const wanted = new Set(sims.map((s) => `${s.slug}.png`));
    for (const file of await readdir(THUMBS_DIR)) {
      if (file.endsWith('.png') && !wanted.has(file)) {
        await rm(join(THUMBS_DIR, file));
        console.log(`removed orphaned thumbnail ${file}`);
      }
    }
  } finally {
    await browser?.close();
    server.kill();
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} thumbnail(s) failed: ${failures.join(', ')}`);
    process.exit(1);
  }
  console.log(`\nall ${sims.length} thumbnails captured.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
