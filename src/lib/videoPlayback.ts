// Share observation and page-visibility handling across all project videos.
type Entry = { video: HTMLVideoElement; near: boolean };
const entries = new Map<Element, Entry>();
let observer: IntersectionObserver | undefined;
let preloadObserver: IntersectionObserver | undefined;

function update(entry: Entry) {
  if (entry.near && !document.hidden) {
    if (!entry.video.paused) return;
    entry.video.play().then(() => {
      if (!entry.near || document.hidden) entry.video.pause();
    }).catch(() => {});
  } else entry.video.pause();
}
function onVisibility() { entries.forEach(update); }

export function observeVideoPlayback(element: Element, video: HTMLVideoElement) {
  if (!observer) {
    observer = new IntersectionObserver((changes) => {
      changes.forEach((change) => {
        const entry = entries.get(change.target);
        if (!entry) return;
        entry.near = change.isIntersecting;
        update(entry);
      });
    }, { threshold: 0, rootMargin: '80px' });
    // Prepare the first frame ahead of the viewport without decoding the
    // whole loop continuously while it is still offscreen.
    preloadObserver = new IntersectionObserver((changes) => {
      changes.forEach(change => {
        if (!change.isIntersecting) return;
        const entry = entries.get(change.target);
        if (entry && entry.video.preload === 'none') {
          entry.video.preload = 'auto';
          if (!entry.near && entry.video.paused) entry.video.load();
        }
        preloadObserver?.unobserve(change.target);
      });
    }, { threshold: 0, rootMargin: '400px' });
    document.addEventListener('visibilitychange', onVisibility);
  }
  const entry = { video, near: false };
  entries.set(element, entry);
  observer.observe(element);
  preloadObserver?.observe(element);
  return () => {
    entry.near = false;
    video.pause();
    observer?.unobserve(element);
    preloadObserver?.unobserve(element);
    entries.delete(element);
    if (!entries.size) {
      observer?.disconnect();
      observer = undefined;
      preloadObserver?.disconnect();
      preloadObserver = undefined;
      document.removeEventListener('visibilitychange', onVisibility);
    }
  };
}
