/* ═══════════════════════════════════════════════════════════
   breathing.js — the site's pulse.
   An independent requestAnimationFrame loop, decoupled from
   scroll: the space breathes even when nobody moves.
   Exposes window.Breath for the grain field and scroll spine.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const CYCLE = 5.6;              // seconds per breath
  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const Breath = {
    value: 0,        // 0..1 eased sine — the breath itself
    amplitude: 1,    // 0..1 — closing room decays this toward stillness
    velocity: 0,     // smoothed |scroll velocity|, 0..1
    time: 0,
    reduced: reducedQuery.matches,

    /* the closing room exhales: scroll.js drives this toward 0 */
    setRest(factor) { this.amplitude = Math.max(0, Math.min(1, factor)); },
  };
  window.Breath = Breath;

  const root = document.documentElement;
  if (Breath.reduced) root.classList.add('reduced-motion');
  reducedQuery.addEventListener('change', (e) => {
    Breath.reduced = e.matches;
    root.classList.toggle('reduced-motion', e.matches);
  });

  /* ── scroll velocity, sampled independently of GSAP ── */
  let lastY = window.scrollY, lastT = performance.now(), rawVel = 0;
  function sampleVelocity(now) {
    const y = window.scrollY;
    const dt = Math.max(16, now - lastT);
    rawVel = Math.abs(y - lastY) / dt;          // px per ms
    lastY = y; lastT = now;
  }

  let start = performance.now();
  let lastVar = -1;

  function frame(now) {
    const t = (now - start) / 1000;
    Breath.time = t;

    sampleVelocity(now);
    // settle toward the raw velocity — quickens on fast scroll, calms when idle
    Breath.velocity += (Math.min(1, rawVel / 2.5) - Breath.velocity) * 0.06;

    // breath quickens slightly under scroll (rate modulated, not replaced)
    const rate = 1 + (Breath.reduced ? 0 : Breath.velocity * 0.5);
    const phase = (t * rate) / CYCLE * Math.PI * 2;
    const sine = (Math.sin(phase) + 1) / 2;          // 0..1
    const eased = sine * sine * (3 - 2 * sine);      // smoothstep for a softer inhale

    const amp = Breath.reduced ? 0.06 : Breath.amplitude;
    Breath.value = eased * amp;

    // hand the pulse to CSS (shadows, glow, title swell) — quantized to
    // avoid style recalc every single frame
    const q = Math.round(Breath.value * 100) / 100;
    if (q !== lastVar) {
      root.style.setProperty('--breath', q);
      lastVar = q;
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
