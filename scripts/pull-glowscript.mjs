// One-time migration: pull all GlowScript programs for user `newproph`
// into src/content/sims/. Idempotent: refreshes source.py and thumbnail.png,
// never overwrites an existing index.md (hand-edited writeups survive).
// Usage: node scripts/pull-glowscript.mjs [--dry-run]
import { mkdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';

const API = 'https://www.glowscript.org/api/user/newproph';
const OUT = 'src/content/sims';
const DRY = process.argv.includes('--dry-run');

// Fetch with retry logic and error handling
async function getJson(url, retries = 1) {
  for (let i = 0; ; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
      return await res.json();
    } catch (err) {
      if (i >= retries) throw err;
      console.warn(`retrying ${url} after: ${err.message}`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

// YAML double-quoted string escaping (via JSON stringify)
const yamlStr = (s) => JSON.stringify(String(s));

// slug: split camelCase (incl. uppercase runs like PIBGreater, VPotential, ABottle),
// then kebab-case everything else
const slugify = (name) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const CANVAS2D = new Set(['pi-collisions', '2d-motion', 'rope-oscillations-sim', 'gravitation-2point', 'yoyo-lab3', 'electric-field-array']);
const PUBLISH = new Set([
  ...CANVAS2D,
  'electric-field-array',
  'many-particles-in-bottle',

]);
// Showpieces first on the index page, in this order:
const SORT = new Map([...PUBLISH].map((s, i) => [s, i + 1]));

const titleCase = (name) =>
  name.replace(/[.\-_]+/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(' ').filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

// 1x1 transparent PNG for programs whose API screenshot is empty ("data:,")
const PLACEHOLDER_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const exists = (p) => access(p).then(() => true, () => false);

const { folders } = await getJson(`${API}/folder/`);

let count = 0;
const seenThisRun = new Map(); // slug -> folder; detects duplicate slugs within one run
for (const folder of folders) {
  const { programs } = await getJson(`${API}/folder/${encodeURIComponent(folder)}/program/`);
  for (const prog of programs) {
    const slug = slugify(prog.name);
    const dir = join(OUT, slug);
    const { source } = await getJson(`${API}/folder/${encodeURIComponent(folder)}/program/${encodeURIComponent(prog.name)}`);
    const versionLine = source.split('\n')[0].trim(); // e.g. "Web VPython 3.2"
    const version = (versionLine.match(/(\d+\.\d+)/) || [, 'unknown'])[1];

    const shot = prog.screenshot && prog.screenshot.startsWith('data:image')
      ? Buffer.from(prog.screenshot.split(',')[1], 'base64')
      : PLACEHOLDER_PNG;

    const front = [
      '---',
      `title: ${yamlStr(titleCase(prog.name))}`,
      `summary: ${yamlStr(`Physics simulation from ${folder}.`)}`,
      `publish: ${PUBLISH.has(slug)}`,
      `render: ${CANVAS2D.has(slug) ? 'canvas2d' : 'glowscript'}`,
      `glowscript_version: "${version}"`,
      `folder_origin: ${yamlStr(folder)}`,
      `sort: ${SORT.get(slug) ?? 99}`,
      '---',
      '',
      `Originally written in Web VPython for ${folder}.`,
      '',
    ].join('\n');

    count++;
    const dupInRun = seenThisRun.has(slug);
    if (dupInRun) console.warn(`DUPLICATE slug ${slug}: ${seenThisRun.get(slug)} superseded by ${folder}`);
    seenThisRun.set(slug, folder);
    if (DRY) { console.log(`[dry] ${slug} publish=${PUBLISH.has(slug)} v=${version}`); continue; }
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'source.py'), source);
    await writeFile(join(dir, 'thumbnail.png'), shot);
    if (PUBLISH.has(slug)) {
      // Published sims also get a copy under public/ for the card grid + run button.
      await mkdir('public/sim-thumbs', { recursive: true });
      await writeFile(join('public/sim-thumbs', `${slug}.png`), shot);
    }
    // Later duplicate within the same run fully wins (overwrites index.md);
    // across separate runs the exists-check still protects hand-edited writeups.
    if (dupInRun || !(await exists(join(dir, 'index.md')))) await writeFile(join(dir, 'index.md'), front);
    console.log(`${slug} (${folder}) publish=${PUBLISH.has(slug)}`);
  }
}
console.log(`${count} programs processed`);
