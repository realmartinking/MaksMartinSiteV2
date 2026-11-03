// Run with the server HTML. The painted group animation is the master clock;
// neither hydration nor the time the parser reached this script starts a second clock.
export const mobileIntroQuery = '(hover: none) and (pointer: coarse)';
export const mobileIntroScript = `(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;
  const navigation = performance.getEntriesByType('navigation')[0];
  if (navigation?.type === 'back_forward' || (navigation?.type === 'navigate' &&
      document.referrer && new URL(document.referrer).origin === location.origin)) return;
  const overlay = document.currentScript.previousElementSibling;
  const group = overlay?.querySelector('[data-intro-group]');
  const label = group?.querySelector('[data-mobile-progress]');
  if (!label) return;

  const root = document.documentElement;
  const attribute = matchMedia('${mobileIntroQuery}').matches ? 'data-mobile-intro' : 'data-desktop-intro';
  let clock, firstFrame, frame = 0, failSafe = 0, previous = 0;
  function release() {
    if (overlay.hasAttribute('data-intro-releasing')) return;
    cancelAnimationFrame(frame);
    label.textContent = '100%';
    root.dataset.intro = 'ready';
    // Starting a distinct 300ms fade gives it its full painted lifetime,
    // even if WebKit delivered the group's final frame late.
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
    if (event.target === group) release();
    if (event.target === overlay) finish();
  }
  function tick(now) {
    firstFrame ??= now;
    clock ??= group.getAnimations?.()[0];
    const elapsed = clock ? Number(clock.currentTime ?? 0) : now - firstFrame;
    const percent = Math.max(0, Math.min(100, Math.round((elapsed - 100) / 19)));
    if (percent !== previous) {
      label.textContent = percent + '%';
      previous = percent;
    }
    if (elapsed >= 2700) release();
    else frame = requestAnimationFrame(tick);
  }

  root.dataset.intro = 'loading';
  overlay.setAttribute(attribute, '');
  overlay.addEventListener('animationend', animated);
  window.addEventListener('pagehide', finish, { once: true });
  reduced.addEventListener('change', finish, { once: true });
  // An independent upper bound for a missing stylesheet, suspended animation
  // or interrupted rendering. Normal completion follows the fade's own end.
  failSafe = setTimeout(finish, 4200);
  frame = requestAnimationFrame(tick);
})();`;
