/**
 * Builds a self-contained HTML report from the extractor output.
 */
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const isColorish = (v) => /(#[0-9a-f]{3,8}|rgb|hsl|hwb|lab|lch|oklab|oklch)/i.test(v);

const swatch = (value, count) => `
  <div class="sw">
    <div class="chip" style="background:${esc(value)}"></div>
    <code>${esc(value)}</code>
    <span class="count">${count}</span>
  </div>`;

const tokenRow = (value, count) => `
  <div class="row"><code>${esc(value)}</code><span class="count">${count}</span></div>`;

const customPropsBlock = (props) => {
  const entries = Object.entries(props);
  if (!entries.length) return '<p class="muted">No se encontraron variables CSS personalizadas.</p>';
  return `<div class="grid">${entries
    .map(([k, v]) => {
      const showSwatch = isColorish(v);
      return `<div class="row var">
        ${showSwatch ? `<div class="chip" style="background:${esc(v)}"></div>` : ''}
        <code class="k">${esc(k)}</code><code class="v">${esc(v)}</code>
      </div>`;
    })
    .join('')}</div>`;
};

export function buildReport(data) {
  const colorsCss = data.colors.fromCss.filter((c) => isColorish(c.value));
  const colorsComputed = data.colors.fromComputed;

  return `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8" />
<title>Estilos extraídos · ${esc(data.meta.title || data.meta.url)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 14px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; background:#0b0d10; color:#e7eaf0; }
  header { padding: 28px 32px; border-bottom: 1px solid #1f242c; display:flex; gap:24px; align-items:flex-start; flex-wrap:wrap; }
  header h1 { font-size: 18px; margin: 0 0 4px; font-weight: 600; }
  header .url { color:#7d8aa1; font-size:13px; word-break:break-all; }
  header img { max-width:360px; border-radius:8px; border:1px solid #1f242c; }
  main { padding: 24px 32px 64px; max-width: 1200px; }
  section { margin-top: 36px; }
  section h2 { font-size: 14px; text-transform: uppercase; letter-spacing: .08em; color:#9aa6bd; margin: 0 0 14px; font-weight: 600; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
  .sw { display:flex; align-items:center; gap:10px; padding:8px; border:1px solid #1f242c; border-radius:8px; background:#11151b; }
  .chip { width: 28px; height: 28px; border-radius: 6px; border: 1px solid rgba(255,255,255,.08); flex: none; }
  code { font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; color:#cfd6e4; }
  .row { display:flex; align-items:center; gap:10px; padding:6px 8px; border:1px solid #1f242c; border-radius:6px; background:#11151b; }
  .row.var { gap:8px; }
  .row .k { color:#9bd1ff; }
  .row .v { color:#cfd6e4; opacity:.85; }
  .count { margin-left:auto; font-size:11px; color:#7d8aa1; }
  .muted { color:#7d8aa1; }
  pre { background:#11151b; border:1px solid #1f242c; border-radius:8px; padding:12px; overflow:auto; max-height: 320px; }
  .cols2 { display:grid; grid-template-columns: 1fr 1fr; gap:24px; }
  @media (max-width: 800px) { .cols2 { grid-template-columns: 1fr; } }
</style></head>
<body>
<header>
  <div>
    <h1>${esc(data.meta.title || 'Estilos extraídos')}</h1>
    <div class="url"><a href="${esc(data.meta.url)}" style="color:#9bd1ff">${esc(data.meta.url)}</a></div>
    <div class="muted" style="margin-top:6px">Capturado ${esc(data.meta.ts)} · viewport ${data.meta.viewport.width}×${data.meta.viewport.height}</div>
  </div>
  ${data.screenshotBase64 ? `<img alt="captura" src="data:image/png;base64,${data.screenshotBase64}" />` : ''}
</header>
<main>

<section><h2>Variables CSS (custom properties)</h2>
${customPropsBlock(data.customProps)}
</section>

<section><h2>Paleta de colores · declarados en CSS (${colorsCss.length})</h2>
<div class="grid">${colorsCss.map((c) => swatch(c.value, c.count)).join('')}</div>
</section>

<section><h2>Paleta · presente en estilos calculados (${colorsComputed.length})</h2>
<div class="grid">${colorsComputed.map((c) => swatch(c.value, c.count)).join('')}</div>
</section>

<section><h2>Tipografía</h2>
<div class="cols2">
  <div>
    <h3 style="font-size:12px;color:#9aa6bd;margin:0 0 8px">Familias</h3>
    <div class="grid" style="grid-template-columns:1fr">
      ${data.typography.families.map((f) => tokenRow(f.value, f.count)).join('')}
    </div>
  </div>
  <div>
    <h3 style="font-size:12px;color:#9aa6bd;margin:0 0 8px">Tamaños · peso · line-height</h3>
    <div class="grid" style="grid-template-columns:1fr">
      ${data.typography.sizes.map((f) => tokenRow(f.value, f.count)).join('')}
    </div>
  </div>
</div>
</section>

<section><h2>Border radius</h2>
<div class="grid">${data.borderRadius.map((x) => tokenRow(x.value, x.count)).join('')}</div>
</section>

<section><h2>Sombras (box-shadow)</h2>
<div class="grid" style="grid-template-columns:1fr">${data.boxShadows.map((x) => tokenRow(x.value, x.count)).join('')}</div>
</section>

<section><h2>Espaciado (padding / margin / gap)</h2>
<div class="grid">${data.spacing.map((x) => tokenRow(x.value, x.count)).join('')}</div>
</section>

<section><h2>@font-face declarados (${data.fontFaceRules.length})</h2>
<pre>${esc(data.fontFaceRules.join('\n\n')) || '(ninguno)'}</pre>
</section>

<section><h2>Hojas de estilo cargadas</h2>
<div class="grid" style="grid-template-columns:1fr">
${data.stylesheets.map((s) => tokenRow(`${s.href}  ·  ${s.length} bytes`, '')).join('')}
</div>
</section>

</main></body></html>`;
}
