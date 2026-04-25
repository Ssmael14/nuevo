# Fix para duecaz/w2 — menú: contraste desktop + drawer mobile

Dos archivos modificados (todos los demás siguen igual):

- `assets/css/components/nav.css`
- `assets/css/components/menu.css`

Más detalles en `menu-fix.patch` en la raíz del repo.

## Bugs que cierra

1. **Desktop**: el texto del menú salía negro sobre el hero oscuro.
   Causa: `.menu` define color de skin para mobile y el override desktop no lo neutralizaba.
   Fix: añadido `color: inherit` al `@media (min-width:960px) .menu`.

2. **Mobile**: al abrir el drawer, no se veía nada del menú (parecía que no tenía fondo).
   Causa: `.nav` aplicaba `transform` (vía `is-hidden` / `is-menu-open` / `:focus-within`) y
   `will-change: transform`. Cualquier transform en un ancestro convierte ese ancestro en
   *containing block* de descendientes `position: fixed`. Como `.menu` vive dentro del header,
   su `inset: 0` se estaba calculando contra los 64 px del nav, no contra el viewport.
   Fix: animar el auto-hide con `top` en lugar de `transform`. Sin transform, sin trampa.

## Cómo aplicar

Desde la raíz de tu repo `w2`:

```bash
# Reemplaza solo los dos archivos (preserva el resto)
curl -fsSL https://raw.githubusercontent.com/ssmael14/nuevo/claude/extract-website-styles-NkVGx/w2-fix/assets/css/components/nav.css  -o assets/css/components/nav.css
curl -fsSL https://raw.githubusercontent.com/ssmael14/nuevo/claude/extract-website-styles-NkVGx/w2-fix/assets/css/components/menu.css -o assets/css/components/menu.css
```

O alternativamente, baja el patch unificado:

```bash
curl -fsSL https://raw.githubusercontent.com/ssmael14/nuevo/claude/extract-website-styles-NkVGx/menu-fix.patch | git apply -p2 -
# (-p2 quita los prefijos /tmp/w2 y . del diff que generé en mi sandbox)
```

Si `git apply` se queja de los prefijos, abre el `.patch` y ajústalo a mano — son ~50 líneas.
