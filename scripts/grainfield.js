/* ═══════════════════════════════════════════════════════════
   grainfield.js — the living grain field.
   A full-bleed WebGL plane of slow, breathing noise, quietly
   modulated by an 8-fold Persian star lattice — present only
   as texture and structural rhythm, never as ornament.
   Accent color drifts per room; scroll.js retargets it.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const canvas = document.getElementById('grainfield');
  const gl = canvas.getContext('webgl', { antialias: false, depth: false, alpha: false });

  const ACCENTS = {
    void:      [0x2E / 255, 0x28 / 255, 0x24 / 255],   // warm neutral ember
    clay:      [0x8B / 255, 0x42 / 255, 0x25 / 255],
    verdigris: [0x4A / 255, 0x65 / 255, 0x58 / 255],
    oxblood:   [0x6B / 255, 0x1F / 255, 0x2A / 255],
  };

  const Grain = {
    accent: ACCENTS.void.slice(),   // current (lerped every frame)
    target: ACCENTS.void.slice(),
    setAccent(name) { const c = ACCENTS[name]; if (c) this.target = c.slice(); },
  };
  window.GrainField = Grain;

  if (!gl) { document.body.style.background = 'radial-gradient(120% 100% at 50% 20%, #171310, #0F0D0C)'; return; }

  const VERT = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;

  const FRAG = `
    precision mediump float;
    uniform vec2  u_res;
    uniform float u_time;
    uniform float u_breath;    // 0..1 eased pulse
    uniform float u_vel;       // smoothed scroll velocity 0..1
    uniform float u_scroll;    // page scroll in vh units, for slow parallax
    uniform vec3  u_accent;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float vnoise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y);
    }

    float fbm(vec2 p) {
      float v = 0.0, a = 0.55;
      for (int k = 0; k < 3; k++) {
        v += a * vnoise(p);
        p = p * 2.1 + 17.0;
        a *= 0.5;
      }
      return v;
    }

    /* 8-fold star lattice (khatam rhythm): union of a square and its
       45-degree rotation, repeated — used only to modulate amplitude */
    float starfield(vec2 p) {
      vec2 g = fract(p) - 0.5;
      vec2 q = abs(g);
      float sq = max(q.x, q.y);
      float di = (q.x + q.y) * 0.7071;
      float d  = min(sq, di);                 // 8-point star distance
      float band = 1.0 - smoothstep(0.0, 0.05, abs(d - 0.33));
      return band;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_res;
      vec2 p  = uv * vec2(u_res.x / u_res.y, 1.0);

      float t = u_time * 0.04;

      /* slow cloud drift — the room's air */
      float clouds = fbm(p * 2.2 + vec2(t * 0.7, -t * 0.5) + u_scroll * 0.12);
      clouds = smoothstep(0.25, 0.85, clouds);

      /* lattice, drifting even slower, offset by scroll like walking past */
      float lattice = starfield(p * 3.0 + vec2(t * 0.18, u_scroll * 0.06));

      /* fine living grain */
      float g1 = hash(gl_FragCoord.xy + fract(u_time) * 61.7);
      float grain = (g1 - 0.5);

      float breath = 0.5 + u_breath * 0.9;

      vec3 base = vec3(0.059, 0.051, 0.047);           /* --void */
      vec3 tone = vec3(0.788, 0.761, 0.706);           /* --grain */

      vec3 col = base;
      /* accent glow pooled in the clouds, swelling with the breath */
      col += u_accent * clouds * (0.10 + 0.10 * u_breath + 0.06 * u_vel);
      /* lattice shows as the faintest structural shimmer inside the glow */
      col += u_accent * lattice * clouds * (0.05 + 0.05 * u_breath);
      /* grain flecks at 4-8% */
      col += tone * grain * (0.05 + 0.03 * breath);
      /* gentle vertical falloff so content sits in a lit band */
      col *= 0.85 + 0.3 * (1.0 - abs(uv.y - 0.55));

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('grainfield shader:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  ['u_res', 'u_time', 'u_breath', 'u_vel', 'u_scroll', 'u_accent'].forEach((n) => {
    U[n] = gl.getUniformLocation(prog, n);
  });

  /* render at reduced resolution — it's atmosphere, not imagery */
  const SCALE = 0.45;

  function resize() {
    const w = Math.max(2, Math.round(innerWidth * SCALE));
    const h = Math.max(2, Math.round(innerHeight * SCALE));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }
  addEventListener('resize', resize);
  resize();

  function frame() {
    const B = window.Breath || { time: 0, value: 0, velocity: 0, reduced: false };
    resize();

    // color bleed: current accent eases toward the room's target
    for (let i = 0; i < 3; i++) {
      Grain.accent[i] += (Grain.target[i] - Grain.accent[i]) * 0.035;
    }

    // reduced motion: near-still — only the very slow color drift remains
    const time = B.reduced ? B.time * 0.15 : B.time;

    gl.uniform2f(U.u_res, canvas.width, canvas.height);
    gl.uniform1f(U.u_time, time);
    gl.uniform1f(U.u_breath, B.value);
    gl.uniform1f(U.u_vel, B.reduced ? 0 : B.velocity);
    gl.uniform1f(U.u_scroll, (window.scrollY || 0) / innerHeight);
    gl.uniform3fv(U.u_accent, Grain.accent);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
