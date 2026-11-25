// Pupils follow the pointer, both eyes blink on their own, and the pupils
// drift back to rest once the pointer has been still. Coordinates live in the
// icon's 1254-unit space so the same numbers work at every rendered size
// (header 28px, hero ~360px).
const VIEWBOX = 1254;
const BLINK_MS = 120;
const BLINK_MIN = 4000;
const BLINK_MAX = 9000;
const IDLE_MS = 2500;

type Eye = {
  mark: HTMLElement;
  pupil: SVGCircleElement;
  cx: number;
  cy: number;
  base: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  restX: number;
  restY: number;
};

type Lid = {
  el: SVGGElement;
  cx: number;
  cy: number;
  pupil: SVGCircleElement | null;
};

let started = false;

export function initEyeMarks(): void {
  if (started) return;
  started = true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const eyes: Eye[] = [];
  for (const mark of document.querySelectorAll<HTMLElement>('[data-eye-mark]')) {
    for (const pupil of mark.querySelectorAll<SVGCircleElement>('[data-pupil]')) {
      const group = pupil.closest<SVGGElement>('[data-eye]');
      if (!group) continue;
      const cx = Number(group.dataset.cx);
      const cy = Number(group.dataset.cy);
      const x = Number(pupil.getAttribute('cx'));
      const y = Number(pupil.getAttribute('cy'));
      eyes.push({
        mark,
        pupil,
        cx,
        cy,
        base: Math.hypot(x - cx, y - cy),
        x,
        y,
        tx: x,
        ty: y,
        restX: x,
        restY: y,
      });
    }
  }
  if (eyes.length === 0) return;

  const lids: Lid[] = [];
  for (const el of document.querySelectorAll<SVGGElement>('[data-lid]')) {
    const cx = Number(el.dataset.cx);
    const cy = Number(el.dataset.cy);
    if (Number.isFinite(cx) && Number.isFinite(cy)) {
      lids.push({ el, cx, cy, pupil: el.querySelector<SVGCircleElement>('[data-pupil]') });
    }
  }

  let pointerX = 0;
  let pointerY = 0;
  let hasPointer = false;
  let frame = 0;
  let last = 0;
  let idleTimer: number | undefined;

  const aim = (eye: Eye) => {
    const rect = eye.mark.getBoundingClientRect();
    if (rect.width === 0) return;
    const scale = rect.width / VIEWBOX;
    const dx = pointerX - (rect.left + eye.cx * scale);
    const dy = pointerY - (rect.top + eye.cy * scale);
    const distance = Math.hypot(dx, dy);
    if (distance < 6) return; // keep the last direction instead of spinning
    const t = Math.min(distance / 420, 1);
    const reach = eye.base * (0.34 + 0.66 * t * t * (3 - 2 * t));
    eye.tx = eye.cx + (dx / distance) * reach;
    eye.ty = eye.cy + (dy / distance) * reach;
  };

  const tick = (now: number) => {
    const dt = Math.min(50, now - last || 16);
    last = now;
    const k = 1 - Math.exp(-dt / 85);
    let moving = false;
    for (const eye of eyes) {
      if (hasPointer) aim(eye);
      eye.x += (eye.tx - eye.x) * k;
      eye.y += (eye.ty - eye.y) * k;
      if (Math.abs(eye.tx - eye.x) < 0.05 && Math.abs(eye.ty - eye.y) < 0.05) {
        eye.x = eye.tx;
        eye.y = eye.ty;
      } else {
        moving = true;
      }
      eye.pupil.setAttribute('cx', eye.x.toFixed(2));
      eye.pupil.setAttribute('cy', eye.y.toFixed(2));
    }
    frame = moving ? requestAnimationFrame(tick) : 0;
  };

  const wake = () => {
    if (frame !== 0) return;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  };

  // Pointer stopped: ease the pupils back to their resting position, where the
  // overlay lines up with the raster icon again.
  const rest = () => {
    hasPointer = false;
    for (const eye of eyes) {
      eye.tx = eye.restX;
      eye.ty = eye.restY;
    }
    wake();
  };

  window.addEventListener(
    'pointermove',
    (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      hasPointer = true;
      clearTimeout(idleTimer);
      idleTimer = window.setTimeout(rest, IDLE_MS);
      wake();
    },
    { passive: true },
  );
  window.addEventListener('scroll', wake, { passive: true });
  window.addEventListener('resize', wake, { passive: true });

  // The whole eye (white + pupil) squashes vertically around its centre, so
  // the slit stays parallel to the ground instead of following the icon's
  // tilt; it collapses to 10% and springs back. The pupil fades out on the way
  // down so the closed eye is one clean line instead of a notched slit.
  const blink = () => {
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / BLINK_MS);
      const open = 1 - 0.9 * Math.sin(Math.PI * t);
      const scale = open.toFixed(3);
      const pupilOpacity = Math.max(0, Math.min(1, (open - 0.3) / 0.3)).toFixed(2);
      for (const lid of lids) {
        lid.el.setAttribute(
          'transform',
          `translate(${lid.cx} ${lid.cy}) scale(1 ${scale}) translate(${-lid.cx} ${-lid.cy})`,
        );
        if (lid.pupil) lid.pupil.style.opacity = pupilOpacity;
      }
      if (t < 1) {
        requestAnimationFrame(step);
        return;
      }
      for (const lid of lids) {
        lid.el.removeAttribute('transform');
        if (lid.pupil) lid.pupil.style.opacity = '';
      }
    };
    requestAnimationFrame(step);
  };

  const scheduleBlink = () => {
    const wait = BLINK_MIN + Math.random() * (BLINK_MAX - BLINK_MIN);
    setTimeout(() => {
      if (!document.hidden) blink();
      scheduleBlink();
    }, wait);
  };

  if (lids.length > 0) scheduleBlink();
}
