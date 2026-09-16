// Metadata arrives immediately; buffer upcoming media well before it is visible.
// Playback has a smaller window so distant loops do not run continuously.
type Entry = {
  element: Element; video: HTMLVideoElement; source: string; near: boolean; warm: boolean;
  pending: boolean; abortRetries: number;
};
const entries = new Map<Element, Entry>();
// Infinite feeds repeat the same assets. Prepare one offscreen copy per source;
// visible copies may all play, using the browser's shared HTTP cache.
const preloadOwners = new Map<string, Entry>();
let observer: IntersectionObserver | undefined;
let preloadObserver: IntersectionObserver | undefined;
const current = (entry: Entry) => entries.get(entry.element) === entry;
const wantsPlay = (entry: Entry) => entry.near && !document.hidden;

function update(entry: Entry) {
  if (!current(entry)) return;
  if (entry.warm && !document.hidden && (entry.near || preloadOwners.get(entry.source) === entry)) entry.video.preload = 'auto';
  if (!wantsPlay(entry)) { entry.video.pause(); return; }
  if (!entry.video.paused || entry.pending) return;
  entry.pending = true;
  entry.video.play().then(() => {
    entry.pending = false;
    if (current(entry) && !wantsPlay(entry)) entry.video.pause();
  }).catch((error: unknown) => {
    entry.pending = false;
    // A quick leave/re-enter can interrupt a still-pending play() in WebKit.
    // Retry that race once; policy denials wait for a real user interaction.
    if (current(entry) && wantsPlay(entry) && (error as { name?: string })?.name === 'AbortError' && entry.abortRetries++ < 1) update(entry);
  });
}
function refresh() { entries.forEach(update); }
function gesture() { entries.forEach(entry => { entry.abortRetries = 0; update(entry); }); }

export function observeVideoPlayback(element: Element, video: HTMLVideoElement, active?: boolean) {
  if (!observer) {
    observer = new IntersectionObserver(changes => {
      changes.forEach(change => {
        const entry = entries.get(change.target);
        if (!entry) return;
        entry.near = change.isIntersecting;
        if (entry.near) { entry.warm = true; entry.abortRetries = 0; }
        update(entry);
      });
    }, { threshold: 0, rootMargin: '240px' });
    preloadObserver = new IntersectionObserver(changes => {
      changes.forEach(change => {
        if (!change.isIntersecting) return;
        const entry = entries.get(change.target);
        if (entry) { entry.warm = true; update(entry); }
        preloadObserver?.unobserve(change.target);
      });
    }, { threshold: 0, rootMargin: '1600px 0px' });
    document.addEventListener('visibilitychange', refresh);
    document.addEventListener('pointerup', gesture, { passive: true });
    window.addEventListener('pageshow', refresh);
  }
  video.defaultMuted = true; video.muted = true; video.playsInline = true;
  const entry: Entry = { element, video, source: video.src, near: active === true, warm: active === true, pending: false, abortRetries: 0 };
  entries.set(element, entry);
  if (!preloadOwners.has(entry.source)) {
    preloadOwners.set(entry.source, entry);
    if (video.preload === 'none') video.preload = 'metadata';
  }
  const ready = () => update(entry);
  video.addEventListener('canplay', ready);
  if (active === undefined) { observer.observe(element); preloadObserver?.observe(element); }
  else update(entry);
  return () => {
    if (!current(entry)) return;
    entry.near = false;
    video.pause();
    video.removeEventListener('canplay', ready);
    observer?.unobserve(element); preloadObserver?.unobserve(element);
    entries.delete(element);
    if (preloadOwners.get(entry.source) === entry) {
      preloadOwners.delete(entry.source);
      const copies = [...entries.values()].filter(other => other.source === entry.source);
      const next = copies.find(other => other.near) ?? copies.find(other => other.warm) ?? copies[0];
      if (next) {
        preloadOwners.set(entry.source, next);
        if (next.video.preload === 'none') next.video.preload = 'metadata';
        update(next);
      }
    }
    if (!entries.size) {
      observer?.disconnect(); observer = undefined;
      preloadObserver?.disconnect(); preloadObserver = undefined;
      document.removeEventListener('visibilitychange', refresh);
      document.removeEventListener('pointerup', gesture);
      window.removeEventListener('pageshow', refresh);
    }
  };
}
