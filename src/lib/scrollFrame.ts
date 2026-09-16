// Lenis publishes after setting the native scroll position, in the same RAF.
// Scroll effects subscribe here instead of waiting for another animation frame.
const listeners = new Set<() => void>();
let driven = false;
let frame = 0;

export function publishScrollFrame() { listeners.forEach((paint) => paint()); }
export function setScrollDriver(active: boolean) { driven = active; }
function nativeScroll() {
  if (!driven && !frame) frame = requestAnimationFrame(() => {
    frame = 0;
    publishScrollFrame();
  });
}
export function subscribeScrollFrame(paint: () => void) {
  if (!listeners.size) window.addEventListener('scroll', nativeScroll, { passive: true });
  listeners.add(paint);
  return () => {
    listeners.delete(paint);
    if (!listeners.size) {
      window.removeEventListener('scroll', nativeScroll);
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };
}
