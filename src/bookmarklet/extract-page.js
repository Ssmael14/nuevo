/* Style extractor — runs in the page itself.
 * Drop into a bookmarklet (see scripts/build-bookmarklet.js) or paste in DevTools.
 * Triggers a download of report.html with the full style fingerprint.
 */
(async () => {
  const COLOR_RE =
    /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\s*\([^)]*\)/g;

  const cssColor = (v) => {
    if (!v) return null;
    const s = String(v).trim();
    if (!s || s === 'none' || s === 'transparent' || s === 'rgba(0, 0, 0, 0)') return null;
    return s;
  };

  const bump = (m, k) => { if (k) m.set(k, (m.get(k) || 0) + 1); };
  const sortMap = (m, n = 50) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([value, count]) => ({ value, count }));

  const customProps = {};
  for (const el of [document.documentElement, document.body]) {
    const cs = getComputedStyle(el);
    for (let i = 0; i < cs.length; i++) {
      const name = cs[i];
      if (name.startsWith('--')) {
        const val = cs.getPropertyValue(name).trim();
        if (val && customProps[name] === undefined) customProps[name] = val;
      }
    }
  }

  const stylesheets = [];
  const colorSet = new Map();
  const fontFaceRules = [];
  const crossOriginHrefs = [];

  for (const sheet of Array.from(document.styleSheets)) {
    let rules;
    try { rules = sheet.cssRules; }
    catch {
      if (sheet.href) crossOriginHrefs.push(sheet.href);
      stylesheets.push({ href: sheet.href || '(inline)', length: 0, crossOrigin: true });
      continue;
    }
    if (!rules) continue;
    const text = Array.from(rules).map((r) => r.cssText).join('\n');
    stylesheets.push({ href: sheet.href || '(inline)', length: text.length });
    const m = text.match(COLOR_RE);
    if (m) for (const c of m) bump(colorSet, c.toLowerCase());
    for (const r of Array.from(rules)) {
      if (r.type === CSSRule.FONT_FACE_RULE) fontFaceRules.push(r.cssText);
    }
  }

  await Promise.all(crossOriginHrefs.slice(0, 40).map(async (href) => {
    try {
      const r = await fetch(href, { credentials: 'omit' });
      if (!r.ok) return;
      const text = await r.text();
      const idx = stylesheets.findIndex((s) => s.href === href);
      if (idx >= 0) stylesheets[idx].length = text.length;
      const m = text.match(COLOR_RE);
      if (m) for (const c of m) bump(colorSet, c.toLowerCase());
      const ff = text.match(/@font-face\s*\{[^}]*\}/g);
      if (ff) for (const r of ff) fontFaceRules.push(r);
    } catch {}
  }));

  const visible = Array.from(document.querySelectorAll('body *')).filter((el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0';
  });

  const sampledColors = new Map();
  const fontFamilySet = new Map();
  const fontSizeSet = new Map();
  const radii = new Map();
  const shadows = new Map();
  const spacings = new Map();

  for (const el of visible.slice(0, 4000)) {
    const cs = getComputedStyle(el);
    bump(sampledColors, cssColor(cs.color));
    bump(sampledColors, cssColor(cs.backgroundColor));
    bump(sampledColors, cssColor(cs.borderTopColor));
    bump(sampledColors, cssColor(cs.outlineColor));
    if (cs.fontFamily) bump(fontFamilySet, cs.fontFamily);
    bump(fontSizeSet, `${cs.fontSize} / ${cs.fontWeight} / ${cs.lineHeight}`);
    bump(radii, cs.borderRadius);
    if (cs.boxShadow && cs.boxShadow !== 'none') bump(shadows, cs.boxShadow);
    [cs.padding, cs.margin, cs.gap].forEach((v) => v && v !== '0px' && bump(spacings, v));
  }

  const data = {
    meta: { url: location.href, title: document.title, viewport: { width: innerWidth, height: innerHeight }, ts: new Date().toISOString() },
    customProps,
    stylesheets,
    fontFaceRules,
    colors: { fromCss: sortMap(colorSet, 80), fromComputed: sortMap(sampledColors, 60) },
    typography: { families: sortMap(fontFamilySet, 30), sizes: sortMap(fontSizeSet, 60) },
    borderRadius: sortMap(radii, 20),
    boxShadows: sortMap(shadows, 20),
    spacing: sortMap(spacings, 30),
  };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isColorish = (v) => /(#[0-9a-f]{3,8}|rgb|hsl|hwb|lab|lch|oklab|oklch)/i.test(v);
  const swatch = (v, c) => `<div class="sw"><div class="chip" style="background:${esc(v)}"></div><code>${esc(v)}</code><span class="count">${c}</span></div>`;
  const row = (v, c) => `<div class="row"><code>${esc(v)}</code>${c !== '' ? `<span class="count">${c}</span>` : ''}</div>`;
  const propsBlock = Object.entries(data.customProps).map(([k, v]) =>
    `<div class="row var">${isColorish(v) ? `<div class="chip" style="background:${esc(v)}"></div>` : ''}<code class="k">${esc(k)}</code><code class="v">${esc(v)}</code></div>`
  ).join('') || '<p class="muted">No se encontraron variables CSS.</p>';

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"/>
<title>Estilos · ${esc(data.meta.title || data.meta.url)}</title>
<style>
*{box-sizing:border-box}body{margin:0;font:14px/1.5 system-ui,sans-serif;background:#0b0d10;color:#e7eaf0}
header{padding:24px 32px;border-bottom:1px solid #1f242c}h1{margin:0 0 4px;font-size:18px}
.url{color:#7d8aa1;font-size:13px;word-break:break-all}main{padding:20px 32px 64px;max-width:1200px}
section{margin-top:32px}h2{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#9aa6bd;margin:0 0 12px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px}
.sw{display:flex;align-items:center;gap:10px;padding:8px;border:1px solid #1f242c;border-radius:8px;background:#11151b}
.chip{width:28px;height:28px;border-radius:6px;border:1px solid rgba(255,255,255,.08);flex:none}
code{font:12px/1.4 ui-monospace,Menlo,monospace;color:#cfd6e4}
.row{display:flex;align-items:center;gap:10px;padding:6px 8px;border:1px solid #1f242c;border-radius:6px;background:#11151b}
.row .k{color:#9bd1ff}.count{margin-left:auto;font-size:11px;color:#7d8aa1}
.muted{color:#7d8aa1}pre{background:#11151b;border:1px solid #1f242c;border-radius:8px;padding:12px;overflow:auto;max-height:320px}
</style></head><body>
<header><h1>${esc(data.meta.title || 'Estilos')}</h1><div class="url">${esc(data.meta.url)}</div>
<div class="muted" style="margin-top:6px">Capturado ${esc(data.meta.ts)} · viewport ${data.meta.viewport.width}×${data.meta.viewport.height}</div></header>
<main>
<section><h2>Variables CSS</h2><div class="grid">${propsBlock}</div></section>
<section><h2>Colores · CSS (${data.colors.fromCss.length})</h2><div class="grid">${data.colors.fromCss.filter(c=>isColorish(c.value)).map(c=>swatch(c.value,c.count)).join('')}</div></section>
<section><h2>Colores · computed (${data.colors.fromComputed.length})</h2><div class="grid">${data.colors.fromComputed.map(c=>swatch(c.value,c.count)).join('')}</div></section>
<section><h2>Familias tipográficas</h2><div class="grid" style="grid-template-columns:1fr">${data.typography.families.map(f=>row(f.value,f.count)).join('')}</div></section>
<section><h2>Tamaños · peso · line-height</h2><div class="grid" style="grid-template-columns:1fr">${data.typography.sizes.map(f=>row(f.value,f.count)).join('')}</div></section>
<section><h2>Border radius</h2><div class="grid">${data.borderRadius.map(x=>row(x.value,x.count)).join('')}</div></section>
<section><h2>Sombras</h2><div class="grid" style="grid-template-columns:1fr">${data.boxShadows.map(x=>row(x.value,x.count)).join('')}</div></section>
<section><h2>Espaciados</h2><div class="grid">${data.spacing.map(x=>row(x.value,x.count)).join('')}</div></section>
<section><h2>@font-face (${data.fontFaceRules.length})</h2><pre>${esc(data.fontFaceRules.join('\n\n')) || '(ninguno)'}</pre></section>
<section><h2>Hojas de estilo</h2><div class="grid" style="grid-template-columns:1fr">${data.stylesheets.map(s=>row(`${s.href} · ${s.length} bytes${s.crossOrigin?' · cross-origin':''}`,'')).join('')}</div></section>
<section><h2>JSON</h2><pre>${esc(JSON.stringify(data,null,2))}</pre></section>
</main></body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `styles-${location.hostname}-${Date.now()}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  console.log('[style-extractor] listo:', data);
})();
