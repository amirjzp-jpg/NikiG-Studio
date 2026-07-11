/* ═══════════════════════════════════════════════════════════
   scroll.js — the walk through the gallery.
   ScrollSmoother is the floor; ScrollTrigger choreographs the
   rooms. Room boundaries bleed (accent + grain retarget with
   easing) so the journey never cuts — it always dissolves.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (!window.gsap || !window.ScrollTrigger) return;   // site stays readable without GSAP

  gsap.registerPlugin(ScrollTrigger);
  if (window.ScrollSmoother) gsap.registerPlugin(ScrollSmoother);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = matchMedia('(max-width: 760px)').matches;
  const root = document.documentElement;

  root.classList.add('has-gsap');   // arms the hidden-until-revealed styles

  /* ── smooth floor ── */
  let smoother = null;
  if (window.ScrollSmoother && !reduced) {
    smoother = ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 1.15,
      effects: !mobile,            // data-speed parallax on desktop only
      smoothTouch: 0.1,
    });
  }

  const ACCENT_LIT = {
    void:      '#C9C2B4',
    clay:      '#C97C55',
    verdigris: '#8FAF9E',
    oxblood:   '#C05A66',
  };
  const ACCENT = {
    void:      '#8B4225',          // neutral rooms keep clay as UI accent
    clay:      '#8B4225',
    verdigris: '#4A6558',
    oxblood:   '#6B1F2A',
  };

  /* ── room-to-room bleed: grain + UI accent retarget on entry ── */
  document.querySelectorAll('.room').forEach((room) => {
    const name = room.dataset.accent || 'void';
    const label = room.dataset.label || '';
    const apply = () => {
      if (window.GrainField) GrainField.setAccent(name);
      gsap.to(root, {
        '--accent': ACCENT[name],
        '--accent-lit': ACCENT_LIT[name],
        duration: 1.1,
        ease: 'power2.out',
        overwrite: 'auto',
      });
      const wf = document.getElementById('room-label');
      if (wf && label) wf.textContent = label;
    };
    ScrollTrigger.create({
      trigger: room,
      start: 'top 55%',
      end: 'bottom 55%',
      onEnter: apply,
      onEnterBack: apply,
    });
  });

  /* ── entry: intro plays after the preloader lifts ── */
  const entryIntro = gsap.timeline({ paused: true });
  entryIntro
    .to('.entry-kicker', { opacity: 1, y: 0, duration: 1.0, ease: 'power2.out' })
    .to('.line-word', { opacity: 1, y: 0, duration: 1.1, stagger: 0.14, ease: 'power3.out' }, '-=0.6')
    .to('.entry-hint', { opacity: 1, y: 0, duration: 1.0, ease: 'power2.out' }, '-=0.4');
  window.playEntryIntro = () => entryIntro.play();
  if (reduced) entryIntro.progress(1);

  /* entry drifts up and dims as you step forward */
  gsap.to('.entry-inner', {
    yPercent: -18, opacity: 0.0, ease: 'none',
    scrollTrigger: { trigger: '#entry', start: 'top top', end: 'bottom 30%', scrub: true },
  });

  /* ── generic reveals: room heads and artworks rise into place ── */
  const reveal = (el, vars = {}) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: reduced ? 0 : 1.4, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 82%', once: true },
      ...vars,
    });
  };
  document.querySelectorAll('.room-head').forEach((el) => reveal(el));
  document.querySelectorAll('.artwork').forEach((el) => reveal(el));
  ['.closing-statement', '.closing-signature', '.closing-mark', '.closing-foot'].forEach((sel, i) => {
    const el = document.querySelector(sel);
    if (el) reveal(el, { delay: i * 0.15 });
  });

  /* ── interstitial: horizontal pan past the studio door ── */
  if (!mobile && !reduced) {
    const track = document.querySelector('.studio-track');
    const pan = () => -(track.scrollWidth - innerWidth + innerWidth * 0.08);
    gsap.fromTo(track, { x: () => innerWidth * 0.06 }, {
      x: pan, ease: 'none',
      scrollTrigger: {
        trigger: '#studio',
        start: 'top top',
        end: () => '+=' + Math.max(600, track.scrollWidth - innerWidth + 400),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });
  }

  /* ── centerpiece: Zal & the Simurgh, layer by layer ── */
  (function centerpiece() {
    const stage = document.querySelector('#centerpiece .cp-stage');
    const pan = document.querySelector('.cp-pan');
    const captions = gsap.utils.toArray('.cp-caption');
    const label = document.querySelector('.cp-label');
    if (!stage || !pan) return;

    /* focus(fx, fy, S): scale about center, then translate so the
       image point (fx, fy) lands in the middle of the viewport */
    const focus = (fx, fy, s) => ({
      scale: s,
      xPercent: (0.5 - fx) * s * 100,
      yPercent: (0.5 - fy) * s * 100,
      ease: 'power1.inOut',
    });

    if (reduced) {
      gsap.set(pan, { scale: 1 });
      gsap.set(captions[3], { opacity: 1 });
      gsap.set(label, { opacity: 1 });
      return;
    }

    const HOLD = 0.55, MOVE = 1;
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#centerpiece',
        start: 'top top',
        end: '+=320%',
        pin: true,
        scrub: 0.8,
        anticipatePin: 1,
      },
    });

    const cap = (idx) =>
      tl.to(captions[idx], { opacity: 1, duration: HOLD * 0.5 })
        .to(captions[idx], { opacity: 0, duration: HOLD * 0.5 }, `+=${HOLD}`);

    /* begin already leaning into the mountain */
    tl.fromTo(pan, focus(0.5, 0.5, 1.04), { ...focus(0.18, 0.44, 2.05), duration: MOVE });
    cap(0);
    tl.to(pan, { ...focus(0.46, 0.80, 1.95), duration: MOVE });         // the fire
    cap(1);
    tl.to(pan, { ...focus(0.20, 0.10, 1.85), duration: MOVE });         // into the flock
    tl.to(pan, { ...focus(0.72, 0.12, 1.85), duration: MOVE * 1.2, ease: 'none' }, '<+0.2'); // pan across the crows
    cap(2);
    tl.to(pan, { ...focus(0.62, 0.22, 1.9), duration: MOVE });          // the Simurgh
    cap(3);
    tl.to(pan, { ...focus(0.5, 0.5, 1.0), duration: MOVE * 1.3 });      // step back: the whole story
    tl.to(label, { opacity: 1, y: 0, duration: 0.5 }, '<+0.5');
    tl.to({}, { duration: 0.4 });                                       // beat of stillness before release
  })();

  /* ── cardboard structure: two aspects, crossfaded like a rotation ── */
  (function rotator() {
    const alt = document.querySelector('.art-rotator .rotator-alt img');
    if (!alt) return;
    gsap.fromTo(alt, { opacity: 0 }, {
      opacity: 1, ease: 'none',
      scrollTrigger: {
        trigger: '.art-rotator',
        start: 'top 70%',
        end: 'bottom 35%',
        scrub: true,
      },
    });
  })();

  /* ── closing: the breath decays toward stillness ── */
  ScrollTrigger.create({
    trigger: '#closing',
    start: 'top 60%',
    end: 'bottom bottom',
    onUpdate(self) {
      if (window.Breath) Breath.setRest(1 - self.progress * 0.96);
    },
    onLeaveBack() { if (window.Breath) Breath.setRest(1); },
  });

  /* keep measurements honest once images arrive */
  addEventListener('load', () => ScrollTrigger.refresh());
})();
