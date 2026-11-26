// A slow, dark-water backdrop: drifting swell lines, rising plankton specks and
// a ripple that answers a click. The render loop stops while the tab is hidden
// and paints a single static frame when the user prefers reduced motion.

type Speck = {
  x: number;
  y: number;
  ox: number;
  oy: number;
  r: number;
  a: number;
  vy: number;
  sway: number;
  phase: number;
  twinkle: number;
  bubble: boolean;
};

type Ripple = { x: number; y: number; r: number; life: number };

type Palette = {
  speck: string;
  ripple: string;
  bubbleAlpha: number;
};

const TAU = Math.PI * 2;

function palette(): Palette {
  const light = document.documentElement.dataset.theme === 'light';
  return light
    ? {
        speck: '18,84,90',
        ripple: '24,96,104',
        bubbleAlpha: 0.6,
      }
    : {
        speck: '206,238,243',
        ripple: '170,225,232',
        bubbleAlpha: 0.85,
      };
}

function rgba(rgb: string, alpha: number): string {
  return `rgba(${rgb},${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
}

export function initOcean(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('.bg-sea-canvas');
  const context2d = canvas?.getContext('2d');
  if (!canvas || !context2d) return;
  const cv = canvas;
  const ctx = context2d;

  const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = { x: 0, y: 0, inside: false };

  // No swell strokes: anything that crosses the viewport reads as a stray line
  // once the page scrolls. The water lives in the gradient, the light beams and
  // the drifting field of specks and bubbles instead.

  let specks: Speck[] = [];
  let ripples: Ripple[] = [];
  let width = 0;
  let height = 0;
  let raf = 0;
  let time = 0;
  let last = 0;

  const makeSpeck = (): Speck => {
    const near = Math.random();
    const bubble = Math.random() < 0.3;
    return {
      x: Math.random() * width,
      // sqrt biases the field toward the deeper half of the viewport.
      y: height * Math.sqrt(Math.random()),
      ox: 0,
      oy: 0,
      r: bubble ? 1.7 + near * 2.8 : 0.9 + near * 1.9,
      a: bubble ? 0.3 + near * 0.45 : 0.16 + near * 0.34,
      vy: 0.05 + near * 0.16,
      sway: 8 + near * 26,
      phase: Math.random() * TAU,
      twinkle: 0.15 + Math.random() * 0.45,
      bubble,
    };
  };

  function resize(): void {
    width = cv.clientWidth;
    height = cv.clientHeight;
    if (!width || !height) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(width * dpr);
    cv.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const target = Math.round(Math.min(110, Math.max(38, (width * height) / 18000)));
    while (specks.length > target) specks.pop();
    while (specks.length < target) specks.push(makeSpeck());
  }

  function drawSea(dt: number): void {
    const p = palette();
    ctx.clearRect(0, 0, width, height);

    const decay = Math.pow(0.95, dt);

    for (let i = 0; i < specks.length; i += 1) {
      const s = specks[i];
      s.y -= s.vy * dt;
      if (s.y < -20) {
        s.y = height + 20;
        s.x = Math.random() * width;
      }
      s.ox *= decay;
      s.oy *= decay;

      if (pointer.inside) {
        const dx = s.x + s.ox - pointer.x;
        const dy = s.y + s.oy - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.001 && dist < 140) {
          const push = (1 - dist / 140) ** 2 * 26;
          s.ox += (dx / dist) * push * dt * 0.3;
          s.oy += (dy / dist) * push * dt * 0.3;
        }
      }
    }

    // Specks and bubbles rise through the water.
    for (let i = 0; i < specks.length; i += 1) {
      const s = specks[i];
      const x = s.x + s.ox + Math.sin(time * 0.35 + s.phase) * s.sway;
      const y = s.y + s.oy + Math.cos(time * 0.28 + s.phase * 1.3) * (s.sway * 0.3);
      const pulse = 1 - s.twinkle + s.twinkle * (0.5 + 0.5 * Math.sin(time * 0.9 + s.phase * 2));

      if (s.bubble) {
        // Hollow ring plus a short rim highlight: the shape that reads as air.
        ctx.lineWidth = Math.min(1.1, Math.max(0.6, s.r * 0.3));
        ctx.strokeStyle = rgba(p.speck, s.a * pulse * 0.8 * p.bubbleAlpha);
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, TAU);
        ctx.stroke();

        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.arc(x, y, s.r, Math.PI * 0.78, Math.PI * 1.32);
        ctx.strokeStyle = rgba(p.speck, Math.min(1, s.a * pulse * 1.5 * p.bubbleAlpha));
        ctx.stroke();
      } else {
        if (s.r > 1.9) {
          ctx.beginPath();
          ctx.arc(x, y, s.r * 3.4, 0, TAU);
          ctx.fillStyle = rgba(p.speck, 0.06 * pulse);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, TAU);
        ctx.fillStyle = rgba(p.speck, s.a * pulse);
        ctx.fill();
      }
    }

    // Click ripples fade as they widen.
    for (let i = ripples.length - 1; i >= 0; i -= 1) {
      const rp = ripples[i];
      rp.r += 90 * dt;
      rp.life -= 0.012 * dt;
      if (rp.life <= 0) {
        ripples.splice(i, 1);
        continue;
      }
      ctx.strokeStyle = rgba(p.ripple, 0.34 * rp.life);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = rgba(p.ripple, 0.18 * rp.life);
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r * 0.62, 0, TAU);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
  }

  function frame(now: number): void {
    const dt = last ? Math.min(3, (now - last) / 16.6667) : 1;
    last = now;
    time += dt / 60;
    drawSea(dt);
    raf = requestAnimationFrame(frame);
  }

  function start(): void {
    if (raf || reduceQuery.matches) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  }

  function stop(): void {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
  }

  function onPointerMove(event: PointerEvent): void {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.inside = true;
  }

  function onPointerLeave(): void {
    pointer.inside = false;
  }

  function onPointerDown(event: PointerEvent): void {
    if (reduceQuery.matches) return;
    ripples.push({ x: event.clientX, y: event.clientY, r: 6, life: 1 });
    if (ripples.length > 6) ripples.shift();
  }

  function onResize(): void {
    resize();
    if (reduceQuery.matches) drawSea(0);
  }

  function onMotionChange(): void {
    if (reduceQuery.matches) {
      stop();
      drawSea(0);
    } else {
      start();
    }
  }

  window.addEventListener('resize', onResize);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerleave', onPointerLeave);
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('blur', onPointerLeave);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  reduceQuery.addEventListener('change', onMotionChange);

  resize();
  if (reduceQuery.matches) drawSea(0);
  else start();
}
