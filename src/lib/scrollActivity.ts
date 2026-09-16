// Notify on gesture boundaries, never through React on every scroll frame.
const listeners = new Set<(moving: boolean) => void>();
let moving = false;
let idle: ReturnType<typeof setTimeout> | undefined;
export const isScrollMoving = () => moving;

export function noteScrollActivity() {
  if (!moving) { moving = true; listeners.forEach(listener => listener(true)); }
  clearTimeout(idle);
  idle = setTimeout(() => {
    moving = false;
    listeners.forEach(listener => listener(false));
  }, 120);
}

export function subscribeScrollActivity(listener: (moving: boolean) => void) {
  if (!listeners.size) window.addEventListener('scroll', noteScrollActivity, { passive: true });
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      window.removeEventListener('scroll', noteScrollActivity);
      clearTimeout(idle);
      moving = false;
    }
  };
}
