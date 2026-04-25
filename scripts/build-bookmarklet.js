#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const src = readFileSync(resolve('src/bookmarklet/extract-page.js'), 'utf8');

// Minify just enough to fit in a browser bookmark URL (no AST work, just whitespace/comment trimming).
const minified = src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')
  .replace(/\n\s*/g, ' ')
  .replace(/\s{2,}/g, ' ')
  .trim();

const bookmarklet = 'javascript:' + encodeURIComponent('(function(){' + minified + '})()');

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8" />
<title>Style extractor · bookmarklet</title>
<style>
  body{font:15px/1.5 system-ui,sans-serif;max-width:720px;margin:48px auto;padding:0 20px;color:#222}
  a.bm{display:inline-block;padding:10px 16px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px;font-weight:600}
  textarea{width:100%;height:140px;font-family:ui-monospace,Menlo,monospace;font-size:11px;padding:10px;border:1px solid #ddd;border-radius:8px}
  ol li{margin-bottom:8px}
</style></head><body>
<h1>Extractor de estilos · bookmarklet</h1>
<p>Arrastra este botón a la barra de marcadores. Después abre cualquier web (insta360, lo que sea) y haz clic en el marcador: te descargará un <code>report.html</code> con paleta, tipografía y tokens.</p>

<p><a class="bm" href="${bookmarklet}">⇩ Extraer estilos</a></p>

<h2>¿No puedes arrastrarlo?</h2>
<ol>
  <li>Crea un marcador nuevo (cualquier página).</li>
  <li>Edítalo y pega lo siguiente como URL:</li>
</ol>
<textarea readonly onclick="this.select()">${bookmarklet}</textarea>

<h2>Modo manual (DevTools)</h2>
<p>También puedes abrir la web, F12 → Console, y pegar el contenido de <code>src/bookmarklet/extract-page.js</code> tal cual.</p>
</body></html>`;

writeFileSync(resolve('bookmarklet.html'), html);
console.log('OK · bookmarklet.html generado (', bookmarklet.length, 'bytes en la URL javascript:)');
