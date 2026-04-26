# Refactor estructural — drawer fuera del header (v0.5.0)

Este es el cambio recomendado #1 de la review: separar conceptual y físicamente
el **header** (`<header class="nav">`) del **drawer mobile** (`<nav class="menu-drawer">`).
Antes el drawer vivía dentro del header y eso causaba la cascada de bugs de
stacking que arrastramos en v0.4.x.

## Qué cambia en HTML

```diff
- <header>
-   <nav-toggle>, <logo>
-   <nav class="menu">              ← drawer DENTRO del header (problema)
-     ...items + footer
-   </nav>
-   <nav-right>
- </header>

+ <header>
+   <nav-toggle>, <logo>
+   <nav class="menu-bar">          ← solo desktop, items horizontales
+     ...items
+   </nav>
+   <nav-right>
+ </header>
+
+ <nav class="menu-drawer">          ← solo mobile, HERMANO del header
+   ...items + footer
+ </nav>
```

## Qué cambia en archivos

| Archivo | Acción |
|---|---|
| `index.html` | reescrito (header reorganizado + `.menu-drawer` separado + `?v=0.5.0`) |
| `assets/css/tokens.css` | bumpea `--version` a `v0.5.0` |
| `assets/css/components/nav.css` | revertido a estado limpio (los parches de stacking ya no son necesarios), comentario de cabecera ampliado |
| `assets/css/components/menu-bar.css` | **nuevo** — barra horizontal desktop |
| `assets/css/components/menu-drawer.css` | **nuevo** — overlay fullscreen mobile + accordion + footer |
| `assets/css/components/menu.css` | **borrar** — sustituido por los dos anteriores |
| `assets/js/menu-drawer.js` | **nuevo** (= antiguo `menu.js` con selectores `.menu` → `.menu-drawer`) |
| `assets/js/menu.js` | **borrar** — renombrado |

## Cómo aplicar (PowerShell, desde la raíz del repo `w2`)

```powershell
$base = "https://raw.githubusercontent.com/ssmael14/nuevo/claude/extract-website-styles-NkVGx/w2-fix"

# 1) Reemplaza los archivos modificados / añade los nuevos
curl.exe -fsSL "$base/index.html"                                    -o index.html
curl.exe -fsSL "$base/assets/css/tokens.css"                         -o assets/css/tokens.css
curl.exe -fsSL "$base/assets/css/components/nav.css"                 -o assets/css/components/nav.css
curl.exe -fsSL "$base/assets/css/components/menu-bar.css"            -o assets/css/components/menu-bar.css
curl.exe -fsSL "$base/assets/css/components/menu-drawer.css"         -o assets/css/components/menu-drawer.css
curl.exe -fsSL "$base/assets/js/menu-drawer.js"                      -o assets/js/menu-drawer.js

# 2) Borra los archivos viejos (renombrados / sustituidos)
Remove-Item assets\css\components\menu.css
Remove-Item assets\js\menu.js
```

Equivalente bash/zsh:

```bash
base=https://raw.githubusercontent.com/ssmael14/nuevo/claude/extract-website-styles-NkVGx/w2-fix
curl -fsSL "$base/index.html"                                    -o index.html
curl -fsSL "$base/assets/css/tokens.css"                         -o assets/css/tokens.css
curl -fsSL "$base/assets/css/components/nav.css"                 -o assets/css/components/nav.css
curl -fsSL "$base/assets/css/components/menu-bar.css"            -o assets/css/components/menu-bar.css
curl -fsSL "$base/assets/css/components/menu-drawer.css"         -o assets/css/components/menu-drawer.css
curl -fsSL "$base/assets/js/menu-drawer.js"                      -o assets/js/menu-drawer.js
rm assets/css/components/menu.css assets/js/menu.js
```

## Verificación visual

Tras aplicar y pushear, en `duecaz.github.io/w2/` deberías ver:

- Esquina superior derecha: badge `DEBUG v0.5.0` (si no, hay caché vieja).
- Desktop ≥960px: barra de navegación horizontal blanca sobre el hero, con underline al hover.
- Mobile <960px: hamburguesa funciona; al abrir, drawer fullscreen blanco; X / logo / WhatsApp visibles arriba sobre el header solid.

## Lo que ya no necesitas (deuda eliminada)

- `position: relative; z-index: 1` en `.nav-toggle` / `.nav-logo` / `.nav-right` — ya no hace falta porque el drawer no es descendiente del nav.
- Animar el auto-hide con `top` en lugar de `transform` — vuelve a ser `transform` (más eficiente, GPU). Sin descendientes fixed dentro del nav, no hay nada que atrapar.
- El `--z-menu: 900` sigue existiendo y ahora **realmente significa** "z-index global del drawer respecto al page", como debería.

## Para la próxima

- Cuando quieras añadir dropdowns en hover en desktop, el lugar correcto es `menu-bar.css` (TODO al final del archivo).
- Los items del drawer y de la barra están duplicados en HTML — cuando integres un build step (Eleventy / Astro / lo que sea) puedes consolidar en una `<template>` única.
