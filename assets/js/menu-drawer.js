/* ==========================================================================
   MENU-DRAWER.JS — overlay fullscreen mobile + accordion submenús
   --------------------------------------------------------------------------
   · Toggle por hamburguesa (.nav-toggle).
   · Cierra con: Escape, click en link hoja, cambio a desktop.
   · Submenús accordion: click en .menu-drawer-link[aria-expanded] togglea.
   · Focus trap mientras está abierto.
   · Bloquea scroll del body con .no-scroll en <html>.
   · Aplica inert al <main>.

   ── EVENTOS (contrato público) ─────────────────────────────────────────────
   EMITE en `document`:
     · CustomEvent('drawer:open',  { detail: {} })  — al abrir
     · CustomEvent('drawer:close', { detail: {} })  — al cerrar
   No escucha eventos de otros módulos.
   Consumidores actuales: nav-scroll.js (marca .nav.is-menu-open).
   Ver EVENTS.md para el contrato global.

   ── DEPENDENCIAS ──────────────────────────────────────────────────────────
   · window.BREAKPOINTS / window.mqMin → breakpoints.js (cargar antes)
   · DOM: .nav-toggle, .menu-drawer, main

   Secciones (Ctrl+F):
     1) ELEMENTOS Y CONFIG
     2) HELPERS (isOpen, focusables)
     3) OPEN / CLOSE  (con guard contra click-spam)
     4) SUBMENÚS (accordion)
     5) LISTENERS
   ========================================================================== */

(() => {

  // === 1) ELEMENTOS Y CONFIG =================================================
  const toggle = document.querySelector('.nav-toggle');
  const drawer = document.querySelector('.menu-drawer');
  const main   = document.querySelector('main');

  if (!toggle || !drawer) return;

  // Lee el breakpoint del nav desde tokens.css (vía breakpoints.js).
  // Fallback a 960 si breakpoints.js no cargó (defensivo, no debería pasar).
  const mqDesktop = (window.mqMin && window.mqMin('nav')) || matchMedia('(min-width: 960px)');

  // Duración de la transición opacity del drawer (ver menu-drawer.css).
  // Usado por el guard isAnimating contra click-spam.
  const TRANSITION_MS = 250;
  let isAnimating = false;


  // === 2) HELPERS ============================================================
  const isOpen = () => drawer.classList.contains('is-open');

  // Lista de elementos enfocables visibles dentro del drawer (focus trap).
  const focusables = () => drawer.querySelectorAll(
    'a, button, [tabindex]:not([tabindex="-1"])'
  );


  // === 3) OPEN / CLOSE =======================================================
  // Guard isAnimating: previene click-spam que abre/cierra a destiempo y
  // rompe el focus-trap. Se libera al terminar la transición CSS.
  const armGuard = () => {
    isAnimating = true;
    setTimeout(() => { isAnimating = false; }, TRANSITION_MS);
  };

  const open = () => {
    if (isAnimating || isOpen()) return;
    armGuard();
    toggle.classList.add('is-active');
    toggle.setAttribute('aria-expanded', 'true');
    drawer.classList.add('is-open');
    document.documentElement.classList.add('no-scroll');
    if (main) main.setAttribute('inert', '');
    document.dispatchEvent(new CustomEvent('drawer:open', { detail: {} }));
    focusables()[0]?.focus();
  };

  const close = () => {
    if (isAnimating || !isOpen()) return;
    armGuard();
    toggle.classList.remove('is-active');
    toggle.setAttribute('aria-expanded', 'false');
    drawer.classList.remove('is-open');
    document.documentElement.classList.remove('no-scroll');
    if (main) main.removeAttribute('inert');
    // Colapsa submenús abiertos al cerrar el drawer
    drawer.querySelectorAll('[aria-expanded="true"]').forEach(b => {
      if (b !== toggle) b.setAttribute('aria-expanded', 'false');
    });
    document.dispatchEvent(new CustomEvent('drawer:close', { detail: {} }));
    toggle.focus();
  };


  // === 4) SUBMENÚS (accordion) ==============================================
  // Cualquier .menu-drawer-link con aria-expanded actúa como toggle de su sublist.
  drawer.querySelectorAll('.menu-drawer-link[aria-expanded]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (mqDesktop.matches) return;          // en desktop el drawer está oculto
      e.preventDefault();
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
    });
  });


  // === 5) LISTENERS ==========================================================

  toggle.addEventListener('click', () => isOpen() ? close() : open());

  // Escape cierra; Tab queda atrapado dentro del drawer.
  document.addEventListener('keydown', e => {
    if (!isOpen()) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') {
      const list = [...focusables()];
      if (!list.length) return;
      const first = list[0];
      const last  = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Click en un link "hoja" (sin submenu) cierra el drawer.
  drawer.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (a && !mqDesktop.matches) close();
  });

  // Si el usuario cambia a desktop con el drawer abierto, limpia estado.
  mqDesktop.addEventListener('change', e => {
    if (e.matches && isOpen()) close();
  });
})();
