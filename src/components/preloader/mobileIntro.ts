// This runs immediately after the server-rendered intro, before React hydration.
// Keep the program self-contained; it must also work if application chunks fail.
export const mobileIntroQuery = '(hover: none) and (pointer: coarse)';
export const mobileIntroScript = `(() => {
  if (!matchMedia('${mobileIntroQuery}').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const navigation = performance.getEntriesByType('navigation')[0];
  // A native retry or another internal link continues the visit. Reloading
  // the page and arriving from elsewhere are still full intro entrances.
  if (navigation?.type === 'navigate' && document.referrer &&
      new URL(document.referrer).origin === location.origin) return;
  const overlay = document.currentScript.previousElementSibling;
  const label = overlay?.querySelector('[data-mobile-progress]');
  if (!label) return;

  const duration = 1900;
  const hold = 150;
  const start = performance.now();
  let frame = 0;
  let previous = -1;
  let timeout = 0;

  function finish() {
    cancelAnimationFrame(frame);
    clearTimeout(timeout);
    overlay.removeAttribute('data-mobile-intro');
    overlay.dispatchEvent(new Event('mobile-intro-finished'));
  }
  function tick(now) {
    const elapsed = Math.max(0, now - start);
    const value = Math.min(100, Math.floor(elapsed * 100 / duration));
    if (value !== previous) {
      label.textContent = value + '%';
      previous = value;
    }
    if (elapsed >= duration + hold) finish();
    else frame = requestAnimationFrame(tick);
  }

  overlay.setAttribute('data-mobile-intro', '');
  timeout = setTimeout(finish, duration + hold + 200);
  tick(start);
})();`;
