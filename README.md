# Style Extractor

Pequeña app para extraer la **paleta de colores, tipografías, tamaños, sombras, border-radius, espaciado y variables CSS** de cualquier página — incluidas las que devuelven `403` a un `fetch`/`curl` directo (insta360.com, por ejemplo).

Funciona porque carga la página con un **Chromium real** vía Playwright, así que el servidor recibe una petición indistinguible de un navegador normal.

## Tres formas de usarlo

1. **Bookmarklet** (la más simple, sin instalar nada). Genera y abre `bookmarklet.html`, arrastra el botón a la barra de marcadores, abre cualquier web y haz clic en el marcador → descarga un `report.html`.
2. **CLI** Node + Playwright (la más completa, ideal para automatizar).
3. **Mini app web** (formulario en `localhost:3000`).

## Uso rápido

```bash
# Bookmarklet (no necesita instalar Playwright, sólo Node para generarlo)
node scripts/build-bookmarklet.js
# abre bookmarklet.html, arrastra el botón a tus marcadores, listo

# CLI / app web (sí necesita Playwright)
npm install
npx playwright install chromium   # solo si no tienes Chromium ya descargado

npm run extract -- https://www.insta360.com/es/   # genera output/report.html
npm run serve                                      # http://localhost:3000
```

Sin argumentos, `npm run extract` usa `https://www.insta360.com/es/` como URL por defecto.

### Si ya tienes Chromium instalado en otra ruta

Pasa la ruta del binario por env var, así no hace falta descargarlo de nuevo:

```bash
CHROMIUM_PATH=/ruta/a/chrome npm run extract -- https://www.insta360.com/es/
```

### Por qué esto funciona donde `curl`/`fetch` da 403

`insta360.com` (y muchas webs comerciales) bloquean clientes que no parezcan un
navegador real: piden TLS fingerprint de Chrome, ejecución de JS, cookies,
headers completos, etc. Playwright lanza un Chromium real, por lo que el
servidor lo trata exactamente igual que a un visitante humano.

## Qué extrae

- **Variables CSS** (`--token`) declaradas en `:root` y `body`.
- **Colores** vistos en las hojas de estilo + en los estilos *computados* de los elementos visibles, con frecuencia de uso.
- **Tipografía**: familias, combinaciones `font-size / weight / line-height`.
- **`@font-face`** declarados.
- **Border-radius, box-shadow, padding/margin/gap** más usados.
- Captura de pantalla del above-the-fold.

Todo el resultado se guarda en `output/`:

- `report.html` — informe autocontenido (incluye la captura embebida).
- `styles.json` — datos crudos para procesar.
- `screenshot.png` — captura.
