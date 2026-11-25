// Pupils follow the pointer. Coordinates live in the icon's 1254-unit space so
// the same numbers work at every rendered size (header 28px, hero ~360px).
const VIEWBOX = 1254;

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
      eyes.push({ mark, pupil, cx, cy, base: Math.hypot(x - cx, y - cy), x, y, tx: x, ty: y });
    }
  }
  if (eyes.length === 0) return;

  let pointerX = 0;
  let pointerY = 0;
  let hasPointer = false;
  let frame = 0;
  let last = 0;

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

  window.addEventListener(
    'pointermove',
    (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      hasPointer = true;
      wake();
    },
    { passive: true },
  );
  window.addEventListener('scroll', wake, { passive: true });
  window.addEventListener('resize', wake, { passive: true });
}
