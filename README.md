# Niki Ghanbari — Studio

A single-page, scroll-driven immersive portfolio: a living gallery that breathes
on its own and transforms as you move through it. Painting, ceramics,
printmaking, and sculpture arranged as one continuous walk through five rooms.

## Viewing

No build step. Serve the folder with any static server and open `index.html`:

```sh
python3 -m http.server 8000
# → http://localhost:8000
```

(Opening `index.html` directly via `file://` also works in most browsers.)

## Structure

```
index.html                 the whole journey: Entry → Fine Art → Studio →
                           Cultural (Shahnameh centerpiece) → Experimental → Closing
styles/
  fonts.css                self-hosted Fraunces / Archivo / Space Mono (OFL)
  tokens.css               material-derived palette + type scale
  layout.css               room structure and artwork placement
  motion.css               motion states and prefers-reduced-motion overrides
scripts/
  breathing.js             independent RAF "breath" loop (scroll-velocity aware)
  grainfield.js            WebGL living grain field with Persian star lattice
  scroll.js                GSAP ScrollSmoother/ScrollTrigger room choreography
  interactions.js          preloader, cursor, hover smudge, wall labels, keys
assets/
  art/                     optimized artwork (WebP + JPEG/PNG fallback + blur)
  fonts/                   woff2 webfonts
  vendor/                  GSAP 3.13 (core, ScrollTrigger, ScrollSmoother)
  source/                  original photographs as uploaded
```

## Notes

- Everything is self-contained — no CDN or network dependency at runtime.
- `prefers-reduced-motion` is fully respected: breathing falls to near-still,
  pins and pans are disabled, all content stays reachable.
- Arrow keys (← →) walk between rooms; every artwork is keyboard-focusable and
  its wall label appears on focus.
