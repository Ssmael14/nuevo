#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { extractStyles } from './extractor.js';
import { buildReport } from './report.js';

const args = process.argv.slice(2);
const url = args[0] || 'https://www.insta360.com/es/';
const outDir = resolve(process.cwd(), args[1] || 'output');

mkdirSync(outDir, { recursive: true });
console.log(`-> Abriendo ${url} con un Chromium real…`);

try {
  const data = await extractStyles(url);
  const safe = { ...data };
  // Don't dump the base64 screenshot into the JSON file - keep it as PNG.
  delete safe.screenshotBase64;

  writeFileSync(resolve(outDir, 'styles.json'), JSON.stringify(safe, null, 2));
  writeFileSync(resolve(outDir, 'screenshot.png'), Buffer.from(data.screenshotBase64, 'base64'));
  writeFileSync(resolve(outDir, 'report.html'), buildReport(data));

  console.log(`OK · HTTP ${data.httpStatus} · ${data.colors.fromCss.length} colores en CSS, ${data.colors.fromComputed.length} en computed, ${data.typography.families.length} familias tipográficas`);
  if (data.colors.fromCss.length === 0 && data.colors.fromComputed.length <= 1) {
    console.warn('AVISO: la página devolvió muy pocos estilos — puede ser un challenge anti-bot, un 403 o un bloqueo de red.');
  }
  console.log(`   JSON     ${resolve(outDir, 'styles.json')}`);
  console.log(`   Captura  ${resolve(outDir, 'screenshot.png')}`);
  console.log(`   Informe  ${resolve(outDir, 'report.html')}`);
} catch (err) {
  console.error('ERROR:', err.message);
  process.exit(1);
}
