function initReveals(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => io.observe(el));
}

initReveals();
document.addEventListener('astro:after-swap', initReveals);
