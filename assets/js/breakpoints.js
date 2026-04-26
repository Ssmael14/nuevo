/* ==========================================================================
   BREAKPOINTS.JS — fuente única para JS de los breakpoints del sitio
   --------------------------------------------------------------------------
   · Lee las custom props --bp-* definidas en tokens.css (single source of
     truth). Si el CSS aún no se aplicó al :root, cae a defaults seguros.
   · Los @media de CSS siguen hardcoded (limitación de la spec); cada uno
     lleva un comentario "/* var(--bp-X) */" para sincronizar a ojo.
   · Cargar ANTES que cualquier otro JS que use matchMedia.
   ========================================================================== */
(() => {
  const css = getComputedStyle(document.documentElement);
  const read = (name, fallback) => {
    const v = parseInt(css.getPropertyValue(name), 10);
    return Number.isFinite(v) ? v : fallback;
  };

  window.BREAKPOINTS = Object.freeze({
    md:  read('--bp-md',  768),
    nav: read('--bp-nav', 960),
    lg:  read('--bp-lg',  1024),
    xl:  read('--bp-xl',  1280),
  });

  /** Helper: matchMedia('(min-width: <bp>px)') tipado. */
  window.mqMin = (bp) => matchMedia(`(min-width: ${window.BREAKPOINTS[bp]}px)`);
})();
