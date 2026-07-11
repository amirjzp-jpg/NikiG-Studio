/* ═══════════════════════════════════════════════════════════
   interactions.js — the hand inside the gallery.
   Preloader (sketch resolving into the mark), progressive
   image reveal, cursor, hover smudge, wall labels, keyboard
   walk between rooms.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ── progressive image reveal ── */
  document.querySelectorAll('.frame img').forEach((img) => {
    const arrive = () => img.classList.add('is-loaded');
    if (img.complete && img.naturalWidth) arrive();
    else img.addEventListener('load', arrive, { once: true });
  });

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ── preloader: a loose stroke resolves into the clean mark ── */
  (function preloader() {
    const shell = document.getElementById('preloader');
    const path = document.getElementById('mark-path');
    const disp = document.getElementById('sketch-disp');
    if (!shell || !path) return;

    const len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;

    const DRAW = reduced ? 200 : 1500;
    const start = performance.now();

    function tick(now) {
      const t = Math.min(1, (now - start) / DRAW);
      const e = 1 - Math.pow(1 - t, 3);                     // easeOutCubic
      path.style.strokeDashoffset = String(len * (1 - e));
      if (disp) disp.setAttribute('scale', String(16 * (1 - e * e)));  // sketch settles into form
      if (t < 1) requestAnimationFrame(tick);
      else finish();
    }

    let finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      setTimeout(() => {
        shell.classList.add('done');
        if (window.playEntryIntro) playEntryIntro();
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      }, reduced ? 50 : 350);
    }

    requestAnimationFrame(tick);
    setTimeout(finish, 3200);                                // never hold the door
  })();

  /* ── custom cursor ── */
  (function cursor() {
    const el = document.getElementById('cursor');
    if (!el || coarse || reduced) { if (el) el.remove(); return; }
    let cx = -100, cy = -100, rx = -100, ry = -100;
    const dot = el.querySelector('.cursor-dot');
    const ring = el.querySelector('.cursor-ring');
    addEventListener('pointermove', (e) => { cx = e.clientX; cy = e.clientY; }, { passive: true });
    (function loop() {
      rx += (cx - rx) * 0.16;
      ry += (cy - ry) * 0.16;
      dot.style.transform = `translate(${cx}px, ${cy}px)`;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('.artwork').forEach((a) => {
      a.addEventListener('pointerenter', () => el.classList.add('is-art'));
      a.addEventListener('pointerleave', () => el.classList.remove('is-art'));
    });
  })();

  /* ── smudge: the frame gives, a little, under the hand.
        Hover-driven with a mouse; drag-driven under a finger. ── */
  (function smudge() {
    if (reduced) return;
    document.querySelectorAll('.artwork').forEach((art) => {
      const frame = art.querySelector('.frame');
      if (!frame) return;
      let raf = null;
      let tx = 0, ty = 0, tr = 0, active = false;

      function apply() {
        raf = null;
        frame.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) rotate(${tr.toFixed(3)}deg)`;
        if (active || Math.abs(tx) > 0.1 || Math.abs(ty) > 0.1) {
          tx *= active ? 1 : 0.82; ty *= active ? 1 : 0.82; tr *= active ? 1 : 0.82;
          if (!active) raf = requestAnimationFrame(apply);
        }
      }
      art.addEventListener('pointermove', (e) => {
        active = true;
        const r = frame.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;    // -0.5 .. 0.5
        const ny = (e.clientY - r.top) / r.height - 0.5;
        tx = nx * 9; ty = ny * 7; tr = nx * 0.7;
        if (!raf) raf = requestAnimationFrame(apply);
      }, { passive: true });
      const release = () => {
        active = false;
        if (!raf) raf = requestAnimationFrame(apply);
      };
      art.addEventListener('pointerleave', release);
      art.addEventListener('pointerup', release);
      art.addEventListener('pointercancel', release);
    });
  })();

  /* ── touch: tap holds the wall label open ── */
  if (coarse) {
    document.querySelectorAll('.artwork').forEach((art) => {
      art.addEventListener('click', () => art.classList.toggle('label-open'));
    });
  }

  /* ── keyboard: arrow keys walk between rooms ── */
  (function keyboardWalk() {
    const rooms = Array.from(document.querySelectorAll('.room'));
    function currentIndex() {
      const mid = innerHeight * 0.5;
      let best = 0, bestD = Infinity;
      rooms.forEach((r, i) => {
        const rect = r.getBoundingClientRect();
        if (rect.top <= mid && rect.bottom >= mid) { best = i; bestD = -1; return; }
        const d = Math.min(Math.abs(rect.top - mid), Math.abs(rect.bottom - mid));
        if (bestD >= 0 && d < bestD) { bestD = d; best = i; }
      });
      return best;
    }
    addEventListener('keydown', (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      let dir = 0;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') dir = 1;
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') dir = -1;
      else return;
      e.preventDefault();
      const target = rooms[Math.max(0, Math.min(rooms.length - 1, currentIndex() + dir))];
      const smoother = window.ScrollSmoother && ScrollSmoother.get && ScrollSmoother.get();
      if (smoother) smoother.scrollTo(target, !reduced, 'top top');
      else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    });
  })();
})();
