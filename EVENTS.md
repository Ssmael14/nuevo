# EVENTS — contrato de eventos custom entre módulos JS

Cada módulo es independiente y se comunica con los demás **solo** vía
`CustomEvent` despachados en `document`. Ningún módulo importa ni referencia
funciones de otro. Esto permite:

- Quitar un módulo sin romper a los demás (los listeners simplemente nunca disparan).
- Añadir nuevos consumidores sin tocar al emisor.
- Tests unitarios por módulo simulando los eventos.

> Convención: **`<componente>:<acción>`** en kebab-case. Payload siempre en `event.detail` (objeto, aunque sea vacío) para futuras extensiones sin breaking change.

---

## Eventos vigentes

### `drawer:open`
- **Emite:** `assets/js/menu-drawer.js`, al abrir el overlay mobile.
- **Detail:** `{}` (reservado para extensiones futuras).
- **Consumidores:**
  - `assets/js/nav-scroll.js` → añade `.nav.is-menu-open`.

### `drawer:close`
- **Emite:** `assets/js/menu-drawer.js`, al cerrar el overlay mobile.
- **Detail:** `{}`.
- **Consumidores:**
  - `assets/js/nav-scroll.js` → quita `.nav.is-menu-open`.

---

## Cómo añadir un nuevo evento

1. **Decide el nombre** siguiendo `componente:acción` (ej. `tabs:change`, `modal:open`).
2. **Documéntalo aquí** ANTES de implementarlo (emisor, detail, consumidores previstos).
3. **Emite** desde el módulo dueño:
   ```js
   document.dispatchEvent(new CustomEvent('tabs:change', {
     detail: { index: nextIdx, prevIndex: prevIdx }
   }));
   ```
4. **Suscribe** en los módulos consumidores:
   ```js
   document.addEventListener('tabs:change', (e) => {
     const { index } = e.detail;
     // ...
   });
   ```
5. **Actualiza la cabecera JSDoc** del módulo emisor (`EMITE en document: ...`) y del consumidor (`ESCUCHA en document: ...`).

---

## Reglas

- **Nunca** llamar funciones exportadas entre módulos del sitio. Si sientes
  esa necesidad, evalúa si hace falta un evento o si los dos módulos deberían
  fusionarse.
- **Detail siempre objeto**, nunca primitivo. `detail: {}` si no hay datos.
- **Idempotencia:** los handlers deben ser seguros frente a eventos duplicados.
