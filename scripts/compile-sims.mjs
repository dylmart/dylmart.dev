// Build-time VPython -> JS for all published glowscript-render sims.
// Writes src/content/sims/<slug>/compiled.js (committed build artifact).
// Usage: node scripts/compile-sims.mjs
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import vm from 'node:vm';

// --- Spike findings (Task 2) ---
// RScompiler.3.2.min.js is a plain browser script (not an ES module) that
// expects to run as a top-level global script, where top-level `this` is
// `window`. It does `external_namespace.RapydScript = namespace` off that
// top-level `this` inside one IIFE, then references the bare identifier
// `RapydScript` from a *separate* top-level IIFE later in the file.
//
// 1) Plain `require()` fails immediately: this repo's package.json has
//    `"type": "module"`, so Node treats the extensionless .js as ESM, where
//    top-level `this` is `undefined` -> `TypeError: Cannot set properties
//    of undefined (setting 'RapydScript')`.
// 2) Forcing CommonJS (e.g. a vendor/package.json with `"type":
//    "commonjs"`) gets further, but under `require()` top-level `this` is
//    `module.exports` (a private object), not `globalThis` -> the later
//    bare `RapydScript` reference throws `ReferenceError: RapydScript is
//    not defined`.
// 3) Fix: execute the file's source with `vm.runInContext`, wrapped in a
//    function explicitly invoked via `.call(globalThis)` inside a fresh
//    vm context, so every top-level `this` inside the vendored file really
//    is that context's global object. No document/navigator/canvas shims
//    were needed for the compiler itself to load.
// 4) `window.glowscript_compile` additionally needs a `vec` global: several
//    of the compiler's own internal baselib helpers (`ρσ_equals`,
//    `ρσ_list_remove`, `ρσ_list_contains`, the `in` operator support) do an
//    unconditional `instanceof vec` check with no `typeof` guard. `vec` is
//    normally supplied by glow.3.2.min.js (the runtime, not loaded here);
//    a trivial `function vec(){}` stub is enough since `instanceof` only
//    needs the identifier to resolve, not real vector behavior.
// 5) The compiler is NOT reentrant: calling `glowscript_compile` more than
//    once against the same loaded instance corrupts internal state and
//    every call after the first throws `Cannot read properties of
//    undefined (reading 'length')` from inside the compiler, even for
//    identical input. Fix: reload the compiler into a fresh `vm` context
//    for every sim compiled.
const compilerSrc = await readFile(new URL('../vendor/RScompiler.3.2.min.js', import.meta.url), 'utf8');

function compileVPython(source) {
  const context = vm.createContext({ console });
  context.window = context;
  context.vec = function () {}; // stub: only needs to satisfy `instanceof`, see (4) above
  vm.runInContext('(function(){' + compilerSrc + '\n}).call(globalThis)', context, {
    filename: 'vendor/RScompiler.3.2.min.js',
  });
  if (typeof context.window.glowscript_compile !== 'function') {
    throw new Error('RScompiler did not register glowscript_compile');
  }
  return context.window.glowscript_compile(source, { lang: 'vpython', version: '3.2', run: false });
}

const ROOT = new URL('..', import.meta.url).pathname;
const SIMS = join(ROOT, 'src/content/sims');

await mkdir(join(ROOT, 'public/sim-code'), { recursive: true });

for (const slug of await readdir(SIMS)) {
  const md = await readFile(join(SIMS, slug, 'index.md'), 'utf8');
  if (!/render: glowscript/.test(md) || !/publish: true/.test(md)) continue;
  const source = await readFile(join(SIMS, slug, 'source.py'), 'utf8');
  let js = compileVPython(source);
  js = ';(function() {' + js +
    '\n;$(function(){ window.__context = { glowscript_container: $("#glowscript").removeAttr("id") }; __main__() })})()';
  js = js.replace('</', '<\\/');
  await writeFile(join(SIMS, slug, 'compiled.js'), js);
  await writeFile(join(ROOT, 'public/sim-code', `${slug}.js`), js);
  console.log(`compiled ${slug} (${js.length} bytes)`);
}
