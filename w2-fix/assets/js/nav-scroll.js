/* ==========================================================================
   NAV-SCROLL.JS
   Comportamiento del header en respuesta al scroll:
     · is-scrolled  → nav sólido (texto oscuro, sombra). Se activa cuando
                      el scroll pasa el final del hero (threshold dinámico).
     · is-hidden    → nav oculto (translateY(-100%)). Se activa al scrollear
                      hacia abajo y se quita al scrollear hacia arriba.
   Pasivo, sin throttle (passive:true ya da 60fps en navegadores modernos).

   Secciones (usa Ctrl+F):
     1) ELEMENTOS Y CONFIG
     2) MEDICIÓN (recalculable en resize)
     3) UPDATE (lógica de scroll)
     4) LISTENERS
   ========================================================================== */

(() => {

  // === 1) ELEMENTOS Y CONFIG =================================================
  const nav  = document.querySelector('.nav');
  if (!nav) return;
  const hero = document.querySelector('.hero');

  const DELTA_TH = 6;   // delta vertical mínimo para considerar dirección de scroll
  const TOP_TH   = 8;   // px desde el top antes de empezar a evaluar is-scrolled

  // Estado entre frames
  let solidThreshold = TOP_TH;  // dónde el nav pasa a sólido
  let lastY      = window.scrollY;
  let lastSolid  = null;
  let lastHidden = null;

  // === 2) MEDICIÓN ===========================================================
  // El threshold del modo "sólido" depende de la altura del hero (si existe).
  // En páginas sin hero, basta con un scroll mínimo.
  const measure = () => {
    const navH = nav.offsetHeight || 64;
    solidThreshold = hero ? Math.max(TOP_TH, hero.offsetHeight - navH) : TOP_TH;
  };

  // === 3) UPDATE =============================================================
  const update = () => {
    const y    = window.scrollY;
    const dy   = y - lastY;
    const navH = nav.offsetHeight || 64;

    // 3a) Toggle modo sólido (texto oscuro / sombra)
    const solid = y > solidThreshold;
    if (solid !== lastSolid) {
      nav.classList.toggle('is-scrolled', solid);
      lastSolid = solid;
    }

    // 3b) Toggle auto-hide (solo si el delta supera el ruido)
    //     - Scroll abajo + ya pasamos el primer tramo  → ocultar
    //     - Scroll arriba                              → mostrar
    //     - En los primeros navH*2 px nunca se oculta  (evita flicker en top)
    if (Math.abs(dy) > DELTA_TH) {
      let hide = lastHidden;
      if (dy > 0 && y > navH * 2)  hide = true;
      else if (dy < 0)             hide = false;

      if (hide !== lastHidden) {
        nav.classList.toggle('is-hidden', hide);
        lastHidden = hide;
      }
    }

    lastY = y;
  };

  // === 4) LISTENERS ==========================================================
  measure();
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', () => { measure(); update(); }, { passive: true });
})();
