#!/usr/bin/env node
/* ==========================================================================
   check-tokens.mjs — auditoría de custom properties (tokens CSS)
   --------------------------------------------------------------------------
   Recorre todos los .css del proyecto y reporta dos tipos de problemas:

     1) Variables USADAS pero NO DEFINIDAS en tokens.css (var fantasma).
        Ej.: hero.css usa --ls-foo pero nadie la declara → silent fail.
        Excepción: var(--foo, fallback) con fallback → OK (es opcional).

     2) Variables DEFINIDAS en tokens.css pero NUNCA USADAS (token muerto).
        Útil para ir limpiando la escala según evoluciona el sistema.

   Notas:
     · Los tokens dentro de [data-theme="..."] (--bg-themed, --fg-themed...)
       cuentan como definidos (los recoge el extractor) y, si se usan en
       cualquier .css, también como usados. Nada especial.
     · --version se considera siempre "usada" (la consume el HTML).
     · Variables con fallback (var(--x, 24px)) se consideran usadas pero
       NO se reportan como "undefined" si no existen en tokens.css.
     · Ignora bloques de comentarios CSS en la extracción de usos.

   Uso:
     node scripts/check-tokens.mjs            # exit 0 si no hay errores reales
     node scripts/check-tokens.mjs --strict   # falla con código 1 también si hay tokens muertos

   Sin dependencias (solo Node ≥18).
   ========================================================================== */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT       = fileURLToPath(new URL('..', import.meta.url));
const TOKENS_CSS = join(ROOT, 'assets/css/tokens.css');
const CSS_DIR    = join(ROOT, 'assets/css');
const STRICT     = process.argv.includes('--strict');

// ---------- 0) helpers ----------------------------------------------------
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '');

const walkCss = (dir, acc = []) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st   = statSync(full);
    if (st.isDirectory())                acc = walkCss(full, acc);
    else if (entry.endsWith('.css'))     acc.push(full);
  }
  return acc;
};

// ---------- 1) extraer definiciones de tokens.css ------------------------
// Captura cualquier "  --foo: <value>;" — incluye los que viven dentro de
// [data-theme="..."] (los queremos como definidos). NO captura var(--foo).
const extractDefinitions = (file) => {
  const src  = stripComments(readFileSync(file, 'utf8'));
  const defs = new Set();
  for (const line of src.split('\n')) {
    const m = line.match(/^\s*(--[a-z0-9-]+)\s*:/);
    if (m) defs.add(m[1]);
  }
  return defs;
};

// ---------- 2) extraer usos var(--foo[, fallback]) en TODOS los .css ------
// Devuelve dos sets:
//   · used        → toda var(--x) detectada (con o sin fallback)
//   · usedNoFallback → solo las var(--x) sin fallback (las que SÍ exigen
//                      definición). Las que tienen fallback son "soft".
const extractUsages = (files) => {
  const used           = new Map();   // name -> Set<file>
  const usedNoFallback = new Map();
  // Detecta var(--foo) o var(--foo, ...). Capturamos opcional la coma post-nombre.
  const re = /var\(\s*(--[a-z0-9-]+)\s*(,)?/g;
  for (const file of files) {
    const src = stripComments(readFileSync(file, 'utf8'));
    let m;
    while ((m = re.exec(src)) !== null) {
      const name        = m[1];
      const hasFallback = m[2] === ',';
      if (!used.has(name)) used.set(name, new Set());
      used.get(name).add(file);
      if (!hasFallback) {
        if (!usedNoFallback.has(name)) usedNoFallback.set(name, new Set());
        usedNoFallback.get(name).add(file);
      }
    }
  }
  return { used, usedNoFallback };
};

// ---------- 3) ejecutar ---------------------------------------------------
const cssFiles                 = walkCss(CSS_DIR);
const defined                  = extractDefinitions(TOKENS_CSS);
const { used, usedNoFallback } = extractUsages(cssFiles);

// Tokens "siempre vivos" aunque no aparezcan como var(...) en CSS.
//   --version    → consumida desde HTML (badge) y desde scripts de release
//   --bp-*       → consumidas por breakpoints.js vía getComputedStyle
const ALWAYS_USED = new Set([
  '--version',
  '--bp-md', '--bp-nav', '--bp-lg', '--bp-xl',
]);

// 3a) Usadas SIN fallback y NO definidas → ERROR
const undefinedUsed = [];
for (const [name, files] of usedNoFallback) {
  if (!defined.has(name)) {
    undefinedUsed.push({ name, files: [...files].map((f) => relative(ROOT, f)) });
  }
}

// 3b) Definidas y NO usadas en ningún var(...) → WARN
const unusedDefined = [];
for (const name of defined) {
  if (ALWAYS_USED.has(name)) continue;
  if (!used.has(name)) unusedDefined.push(name);
}

// ---------- 4) print + exit code -----------------------------------------
const c    = (s, code) => `\x1b[${code}m${s}\x1b[0m`;
const ok   = (s) => c(s, 32);
const warn = (s) => c(s, 33);
const err  = (s) => c(s, 31);

console.log(`\nchecked ${cssFiles.length} CSS files, ${defined.size} tokens defined, ${used.size} tokens referenced.\n`);

if (undefinedUsed.length === 0 && unusedDefined.length === 0) {
  console.log(ok('✓ No token issues.'));
  process.exit(0);
}

if (undefinedUsed.length) {
  console.log(err(`✗ ${undefinedUsed.length} undefined token(s) used without fallback:`));
  for (const { name, files } of undefinedUsed) {
    console.log(`  ${name}`);
    for (const f of files) console.log(`    └─ ${f}`);
  }
  console.log();
}

if (unusedDefined.length) {
  console.log(warn(`⚠ ${unusedDefined.length} defined but unused token(s):`));
  for (const name of unusedDefined) console.log(`  ${name}`);
  console.log();
}

const hasError = undefinedUsed.length > 0;
process.exit((hasError || (STRICT && unusedDefined.length)) ? 1 : 0);
