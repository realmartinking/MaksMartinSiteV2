// Run with the server HTML, not after hydration. All release paths are
// independent of media downloads, animation decoding and application chunks.
export const mobileIntroQuery = '(hover: none) and (pointer: coarse)';
export const mobileIntroScript = `(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;
  const navigation = performance.getEntriesByType('navigation')[0];
  if (navigation?.type === 'back_forward' || (navigation?.type === 'navigate' &&
      document.referrer && new URL(document.referrer).origin === location.origin)) return;
  const overlay = document.currentScript.previousElementSibling;
  const label = overlay?.querySelector('[data-mobile-progress]');
  if (!label) return;

  const root = document.documentElement;
  const attribute = matchMedia('${mobileIntroQuery}').matches ? 'data-mobile-intro' : 'data-desktop-intro';
  let start = performance.now(), frame = 0, failSafe = 0, previous = -1;
  function release() {
    root.dataset.intro = 'ready';
    overlay.setAttribute('data-intro-releasing', '');
  }
  function finish() {
    cancelAnimationFrame(frame);
    clearTimeout(failSafe);
    root.dataset.intro = 'ready';
    overlay.removeAttribute(attribute);
    overlay.removeAttribute('data-intro-releasing');
    overlay.removeEventListener('animationend', animated);
    window.removeEventListener('pagehide', finish);
    reduced.removeEventListener('change', finish);
    overlay.dispatchEvent(new Event('intro-finished'));
  }
  function animated(event) {
    if (event.target === overlay) finish();
  }
  function tick(now) {
    const elapsed = Math.max(0, now - start);
    const percent = Math.max(0, Math.min(100, Math.round((elapsed - 100) / 19)));
    if (percent !== previous) {
      label.textContent = percent + '%';
      previous = percent;
    }
    if (elapsed >= 2700 && !overlay.hasAttribute('data-intro-releasing')) release();
    if (elapsed >= 3000) finish(); else frame = requestAnimationFrame(tick);
  }

  root.dataset.intro = 'loading';
  overlay.setAttribute(attribute, '');
  overlay.addEventListener('animationend', animated);
  window.addEventListener('pagehide', finish, { once: true });
  reduced.addEventListener('change', finish, { once: true });
  failSafe = setTimeout(finish, 3100);
  tick(start);
})();`;
