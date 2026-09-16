export const SCROLL_LERP = 0.055;
export const SCROLL_WHEEL_GAIN = 0.92;

/** Same exponential damping as Lenis, independent of 30/60/120Hz frames. */
export function scrollBlend(deltaMs: number) {
  return 1 - Math.exp(-SCROLL_LERP * 60 * deltaMs / 1000);
}
