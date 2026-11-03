// A poster is enough for an offscreen card. Attach a movie only while it has
// a playback slot and release its decoder and buffer when the slot is lost.
type Entry = {
  element: Element;
  video: HTMLVideoElement;
  source: string;
  poster?: string;
  ratio: number;
  selected: boolean;
  manual: boolean;
  attached: boolean;
  attempt: number;
  pending: boolean;
  blocked: boolean;
  stalled: boolean;
  stallTimer?: ReturnType<typeof setTimeout>;
  onManual: (show: boolean, deferred?: boolean) => void;
};
const entries = new Map<Element, Entry>();
const visible = new Set<Entry>();
let observer: IntersectionObserver | undefined;

function release(entry: Entry) {
  if (!entry.attached) return;
  clearTimeout(entry.stallTimer);
  entry.stallTimer = undefined;
  entry.stalled = false;
  entry.attempt++;
  entry.pending = false;
  entry.attached = false;
  entry.blocked = false;
  entry.video.pause();
  entry.video.removeAttribute('src');
  entry.video.removeAttribute('poster');
  entry.video.load();
}

function play(entry: Entry, retryAbort = true) {
  const video = entry.video;
  if (!entry.attached) {
    entry.attached = true;
    if (entry.poster) video.poster = entry.poster;
    video.src = entry.source;
  }
  if (entry.pending || entry.blocked || !video.paused) return;
  const attempt = ++entry.attempt;
  entry.pending = true;
  video.play().then(() => {
    if (attempt === entry.attempt) entry.pending = false;
  }).catch((error: unknown) => {
    if (attempt !== entry.attempt) return;
    entry.pending = false;
    if ((error as { name?: string })?.name === 'AbortError' && retryAbort) {
      play(entry, false);
      return;
    }
    // A tap can satisfy Safari's autoplay policy, or retry an interrupted load.
    entry.blocked = true;
    entry.onManual(true);
  });
}

function refresh() {
  // Small changes at viewport edges should not repeatedly tear down a decoder.
  const priority = (entry: Entry) => Math.floor(entry.ratio * 4) + Number(entry.attached);
  const ranked = [...visible].sort((a, b) =>
    Number(b.selected) - Number(a.selected) || Number(b.manual) - Number(a.manual) || priority(b) - priority(a)
  );
  const mobile = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  // Grid and Gallery share two automatic slots on phones. In the Roll the
  // camera explicitly selects three, and those must keep playing together.
  const mobileLimit = Math.max(2, ranked.filter(entry => entry.selected).length);
  const limit = document.hidden ? 0 : mobile ? mobileLimit : ranked.length;
  // Free old slots before asking WebKit for another decoder.
  for (const entry of ranked.slice(limit)) {
    release(entry);
    entry.onManual(!document.hidden, true);
  }
  for (const entry of ranked.slice(0, limit)) {
    entry.onManual(entry.blocked || entry.stalled);
    play(entry);
  }
}

export function requestProjectPlayback(element: Element) {
  const entry = entries.get(element);
  if (!entry || !visible.has(entry)) return;
  visible.forEach(other => { other.manual = false; });
  entry.manual = true;
  entry.blocked = false;
  if (entry.stalled || entry.video.error) release(entry);
  refresh(); // play() runs within this user gesture.
}

/** Safari may deny all three muted clips until a tap, key or completed swipe.
 * Retry them within that same gesture, without restarting a playing neighbour. */
export function retrySelectedPlayback(container: Element) {
  for (const entry of visible) {
    if (entry.selected && entry.attached && entry.video.paused && container.contains(entry.element)) {
      entry.blocked = false;
      entry.onManual(entry.stalled);
      play(entry);
    }
  }
}

export function observeVideoPlayback(
  element: Element, video: HTMLVideoElement, source: string, active: boolean | undefined,
  onManual: (show: boolean, deferred?: boolean) => void, poster?: string,
) {
  if (!observer) {
    observer = new IntersectionObserver(changes => {
      changes.forEach(change => {
        const entry = entries.get(change.target);
        if (!entry) return;
        entry.ratio = change.intersectionRatio;
        if (change.isIntersecting && entry.ratio > 0) visible.add(entry);
        else {
          visible.delete(entry);
          entry.manual = false;
          release(entry);
          entry.onManual(false);
        }
      });
      refresh();
    }, { threshold: [0, 0.01, 0.25, 0.5, 0.75, 1] });
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('pageshow', refresh);
  }
  video.defaultMuted = true;
  video.muted = true;
  video.playsInline = true;
  const entry: Entry = { element, video, source, poster, ratio: active ? 1 : 0, selected: active === true, manual: false,
    attached: false, attempt: 0, pending: false, blocked: false, stalled: false, onManual };
  entries.set(element, entry);
  const ready = () => { if (entry.attached) play(entry); };
  const failed = () => {
    if (entry.attached && video.error) { entry.blocked = true; onManual(true); }
  };
  // An iOS player may stay in "waiting" without rejecting play() or firing error.
  // Keep its download alive, but offer a genuine user-initiated restart after 5s.
  let stalledAt = 0;
  const waiting = () => {
    if (!entry.attached || entry.blocked || entry.stallTimer || entry.stalled) return;
    stalledAt = video.currentTime;
    entry.stallTimer = setTimeout(() => {
      entry.stallTimer = undefined;
      if (entry.attached && Math.abs(video.currentTime - stalledAt) < 0.01) {
        entry.stalled = true;
        onManual(true);
      }
    }, 5000);
  };
  const progressing = () => {
    if ((!entry.stallTimer && !entry.stalled) || Math.abs(video.currentTime - stalledAt) < 0.01) return;
    clearTimeout(entry.stallTimer);
    entry.stallTimer = undefined;
    if (entry.stalled) { entry.stalled = false; onManual(entry.blocked); }
  };
  video.addEventListener('waiting', waiting);
  video.addEventListener('stalled', waiting);
  video.addEventListener('timeupdate', progressing);
  video.addEventListener('canplay', ready);
  video.addEventListener('error', failed);
  onManual(false);
  if (active === undefined) observer.observe(element);
  else if (active) { visible.add(entry); refresh(); }
  return () => {
    observer?.unobserve(element);
    entries.delete(element);
    visible.delete(entry);
    video.removeEventListener('waiting', waiting);
    video.removeEventListener('stalled', waiting);
    video.removeEventListener('timeupdate', progressing);
    video.removeEventListener('canplay', ready);
    video.removeEventListener('error', failed);
    release(entry);
    if (!entries.size) {
      observer?.disconnect();
      observer = undefined;
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('pageshow', refresh);
    } else refresh();
  };
}
