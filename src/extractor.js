import { chromium } from 'playwright';

/**
 * Launches a real Chromium, loads the URL, and pulls the full style fingerprint
 * (CSS custom properties, raw stylesheets, computed styles, fonts, etc.).
 * Using a real browser bypasses the bot/anti-fetch defences (e.g. the 403 that
 * insta360.com returns to plain curl/fetch).
 */
export async function extractStyles(url, opts = {}) {
  const {
    viewport = { width: 1440, height: 900 },
    waitUntil = 'networkidle',
    timeout = 60_000,
    locale = 'es-ES',
    userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  } = opts;

  const launchOpts = { headless: true };
  if (process.env.CHROMIUM_PATH) launchOpts.executablePath = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(launchOpts);
  const context = await browser.newContext({
    viewport,
    locale,
    userAgent,
    bypassCSP: true,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  const response = await page.goto(url, { waitUntil, timeout });
  const status = response ? response.status() : 0;

  // Trigger lazy-loaded styles by scrolling through the document, then settle.
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let y = 0;
      const step = () => {
        window.scrollTo(0, y);
        y += window.innerHeight;
        if (y < document.body.scrollHeight) setTimeout(step, 120);
        else { window.scrollTo(0, 0); resolve(); }
      };
      step();
    });
  }).catch(() => {});
  await page.waitForTimeout(1500);

  const screenshot = await page.screenshot({ fullPage: false, type: 'png' });

  const data = await page.evaluate(async () => {
    const cssColor = (v) => {
      if (!v) return null;
      const s = String(v).trim();
      if (!s || s === 'none' || s === 'transparent' || s === 'rgba(0, 0, 0, 0)') return null;
      return s;
    };

    const customProps = {};
    const collectCustomProps = (el) => {
      const cs = getComputedStyle(el);
      for (let i = 0; i < cs.length; i++) {
        const name = cs[i];
        if (name.startsWith('--')) {
          const val = cs.getPropertyValue(name).trim();
          if (val && customProps[name] === undefined) customProps[name] = val;
        }
      }
    };
    collectCustomProps(document.documentElement);
    collectCustomProps(document.body);

    const stylesheets = [];
    const colorSet = new Map();
    const fontFamilySet = new Map();
    const fontSizeSet = new Map();
    const fontFaceRules = [];

    const bump = (map, key) => {
      if (!key) return;
      map.set(key, (map.get(key) || 0) + 1);
    };

    const COLOR_RE =
      /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\s*\([^)]*\)/g;

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

      const colorMatches = text.match(COLOR_RE);
      if (colorMatches) for (const c of colorMatches) bump(colorSet, c.toLowerCase());

      for (const r of Array.from(rules)) {
        if (r.type === CSSRule.FONT_FACE_RULE) {
          fontFaceRules.push(r.cssText);
        }
      }
    }

    // Fallback for cross-origin stylesheets: fetch the raw CSS text and scan it.
    await Promise.all(
      crossOriginHrefs.slice(0, 30).map(async (href) => {
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
        } catch { /* CORS or network failure — skip */ }
      })
    );

    const visibleEls = Array.from(document.querySelectorAll('body *')).filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return false;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') return false;
      return true;
    });

    const sampledColors = new Map();
    const radii = new Map();
    const shadows = new Map();
    const spacings = new Map();

    for (const el of visibleEls.slice(0, 4000)) {
      const cs = getComputedStyle(el);
      bump(sampledColors, cssColor(cs.color));
      bump(sampledColors, cssColor(cs.backgroundColor));
      bump(sampledColors, cssColor(cs.borderTopColor));
      bump(sampledColors, cssColor(cs.outlineColor));

      const ff = cs.fontFamily;
      if (ff) bump(fontFamilySet, ff);
      bump(fontSizeSet, `${cs.fontSize} / ${cs.fontWeight} / ${cs.lineHeight}`);

      bump(radii, cs.borderRadius);
      if (cs.boxShadow && cs.boxShadow !== 'none') bump(shadows, cs.boxShadow);
      [cs.padding, cs.margin, cs.gap].forEach((v) => v && v !== '0px' && bump(spacings, v));
    }

    const sortMap = (m, n = 50) =>
      [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([value, count]) => ({ value, count }));

    return {
      meta: {
        url: location.href,
        title: document.title,
        viewport: { width: innerWidth, height: innerHeight },
        ts: new Date().toISOString(),
      },
      customProps,
      stylesheets,
      fontFaceRules,
      colors: {
        fromCss: sortMap(colorSet, 80),
        fromComputed: sortMap(sampledColors, 60),
      },
      typography: {
        families: sortMap(fontFamilySet, 30),
        sizes: sortMap(fontSizeSet, 60),
      },
      borderRadius: sortMap(radii, 20),
      boxShadows: sortMap(shadows, 20),
      spacing: sortMap(spacings, 30),
    };
  });

  await browser.close();
  return { ...data, httpStatus: status, screenshotBase64: screenshot.toString('base64') };
}
