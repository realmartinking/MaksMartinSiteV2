// Share observation and page-visibility handling across all project videos.
type Entry = { video: HTMLVideoElement; near: boolean };
const entries = new Map<Element, Entry>();
let observer: IntersectionObserver | undefined;

function update(entry: Entry) {
  if (entry.near && !document.hidden) {
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
    }, { threshold: 0.05, rootMargin: '400px' });
    document.addEventListener('visibilitychange', onVisibility);
  }
  const entry = { video, near: false };
  entries.set(element, entry);
  observer.observe(element);
  return () => {
    entry.near = false;
    video.pause();
    observer?.unobserve(element);
    entries.delete(element);
    if (!entries.size) {
      observer?.disconnect();
      observer = undefined;
      document.removeEventListener('visibilitychange', onVisibility);
    }
  };
}
