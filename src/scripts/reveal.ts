// Scroll reveal + a little pointer parallax for the hero mark. Both are
// no-ops when the user asks for reduced motion.

export function initReveal(): void {
  const items = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (!items.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach((item) => item.classList.add('is-in'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );

  items.forEach((item, index) => {
    item.style.setProperty('--reveal-delay', `${Math.min(index * 45, 220)}ms`);
    observer.observe(item);
  });
}

export function initParallax(): void {
  const target = document.querySelector<HTMLElement>('.hero-mark-wrap');
  if (!target) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let goalX = 0;
  let goalY = 0;
  let x = 0;
  let y = 0;
  let raf = 0;

  const tick = () => {
    x += (goalX - x) * 0.09;
    y += (goalY - y) * 0.09;
    target.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    raf = Math.abs(goalX - x) > 0.05 || Math.abs(goalY - y) > 0.05 ? requestAnimationFrame(tick) : 0;
  };

  window.addEventListener(
    'pointermove',
    (event) => {
      goalX = (event.clientX / window.innerWidth - 0.5) * 16;
      goalY = (event.clientY / window.innerHeight - 0.5) * 14;
      if (!raf) raf = requestAnimationFrame(tick);
    },
    { passive: true },
  );
}
