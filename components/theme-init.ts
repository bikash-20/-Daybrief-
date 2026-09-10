/**
 * Pre-paint theme initializer.
 *
 * This script runs synchronously in <head> BEFORE React hydrates and BEFORE
 * the first paint. It applies the user's stored theme to <html data-theme>
 * AND to the matching <meta name="theme-color"> tag, so the OS chrome
 * (address bar, splash, PWA title bar) matches the app on cold load with
 * zero flash.
 *
 * The script is delivered as a single JSON <script type="application/json">
 * block, then parsed and executed by the inline bootstrap. This eliminates
 * any string-interpolation / escaping concerns — JSON.parse handles every
 * edge case including `</script>` and Unicode.
 *
 * DO NOT inline theme ids or hex values directly into a string template.
 */

export type ThemeBootstrap = {
  storageKey: string;
  defaultId: string;
  themes: ReadonlyArray<{ id: string; bgHex: string; isDark: boolean }>;
};

export function themeBootstrapScript(_payload: ThemeBootstrap): string {
  // The payload is JSON.stringify'd at build time inside layout.tsx. The
  // bootstrap reads from a sibling <script type="application/json" id="...">.
  // We accept the payload arg so the caller can validate the type at build
  // time, but the runtime doesn't need it — it reads from the DOM.
  void _payload;
  return `
(function(){
  try {
    var el = document.getElementById('__daybrief_theme_payload__');
    if (!el) return;
    var p = JSON.parse(el.textContent || '{}');
    var k = p.storageKey;
    var ids = (p.themes || []).map(function(t){ return t.id; });
    var byId = Object.create(null);
    (p.themes || []).forEach(function(t){ byId[t.id] = t; });
    var def = p.defaultId;
    var v = null;
    try { v = localStorage.getItem(k); } catch(e) {}
    var id = (v && byId[v]) ? v : def;
    var t = byId[id] || byId[def];

    if (id) document.documentElement.setAttribute('data-theme', id);

    var hex = t ? t.bgHex : null;
    if (!hex) return;

    // No-media theme-color — Safari + Windows tile.
    var bare = document.querySelector('meta[name="theme-color"]:not([media])');
    if (bare) bare.setAttribute('content', hex);

    // msapplication tile color (Windows pinned).
    var tile = document.querySelector('meta[name="msapplication-TileColor"]');
    if (tile) tile.setAttribute('content', hex);

    // Per-theme theme-color meta tags (data-theme-id). Each one gets its
    // own hex so a future swap is instant — and the active one gets the
    // *resolved* hex for its media query so the OS picks it correctly.
    var tagged = document.querySelectorAll('meta[name="theme-color"][data-theme-id]');
    tagged.forEach(function(m){
      var tid = m.getAttribute('data-theme-id');
      var tdef = byId[tid];
      if (!tdef) return;
      m.setAttribute('content', tdef.bgHex);
    });
  } catch (e) { /* bootstrap is best-effort */ }
})();
`.trim();
}
