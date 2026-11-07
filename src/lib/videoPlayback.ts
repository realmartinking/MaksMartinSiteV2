// Phones release inactive decoders. Desktop keeps a small paused cache so
// returning to a card or tab does not restart a movie that was already playing.
type Entry = {
  element: Element;
  video: HTMLVideoElement;
  source: string;
  poster?: string;
  ratio: number;
  selected: boolean;
  active: boolean | undefined;
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
const playing = new Set<Entry>();
const retained = new Set<Entry>();
const nearby = new Set<Entry>();
const DESKTOP_RETAINED_LIMIT = 6;
let warming: Entry | undefined;
let observer: IntersectionObserver | undefined;
let preloadObserver: IntersectionObserver | undefined;
let mobileQuery: MediaQueryList | undefined;
let prewarmQueued = false;
const current = (entry: Entry) => entries.get(entry.element) === entry;
const wantsPlay = (entry: Entry) => current(entry) && playing.has(entry) && !document.hidden;

function clearStall(entry: Entry) {
  clearTimeout(entry.stallTimer);
  entry.stallTimer = undefined;
  entry.stalled = false;
}

function release(entry: Entry) {
  retained.delete(entry);
  if (warming === entry) warming = undefined;
  if (!entry.attached) return;
  clearStall(entry);
  entry.attempt++;
  entry.pending = false;
  entry.attached = false;
  entry.blocked = false;
  entry.video.pause();
  entry.video.removeAttribute('src');
  entry.video.removeAttribute('poster');
  entry.video.load();
}

function retain(entry: Entry) {
  if (!entry.attached || retained.has(entry)) return;
  clearStall(entry);
  entry.attempt++;
  entry.pending = false;
  entry.blocked = false;
  entry.video.pause();
  retained.add(entry);
  // Insertion order keeps the most recently used paused movies. Playing
  // entries are removed from this set and can never be evicted here.
  while (retained.size > DESKTOP_RETAINED_LIMIT) release(retained.values().next().value!);
}

function play(entry: Entry, retryAbort = true) {
  if (!wantsPlay(entry)) return;
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
    if (!current(entry)) return;
    if (attempt === entry.attempt) entry.pending = false;
    if (!wantsPlay(entry)) video.pause();
  }).catch((error: unknown) => {
    if (!current(entry) || attempt !== entry.attempt) return;
    entry.pending = false;
    if (!wantsPlay(entry)) return;
    if ((error as { name?: string })?.name === 'AbortError' && retryAbort) {
      play(entry, false);
      return;
    }
    // A tap can satisfy Safari's autoplay policy, or retry an interrupted load.
    entry.blocked = true;
    entry.onManual(true);
  });
}

function prewarm() {
  if (!entries.size) return;
  const connection = (window.navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  if (mobileQuery?.matches || document.hidden || connection?.saveData ||
      /^(slow-2g|2g|3g)$/.test(connection?.effectiveType ?? '')) return;
  // Safari does not report connection speed. Reserve its bandwidth for the
  // current loops until each has one continuous, fully buffered range.
  // Explicit List/Folder/Roll selections never queue their hidden alternatives.
  if (warming || [...playing].some(({ video }) => video.readyState < 3 ||
      !Number.isFinite(video.duration) || video.duration <= 0 || !video.buffered.length ||
      video.buffered.start(0) > 0.1 || video.buffered.end(0) < video.duration - 0.1)) return;
  const candidates = [...nearby].filter(entry => current(entry) && entry.active === undefined &&
    !visible.has(entry) && !entry.attached);
  const distance = (entry: Entry) => {
    const box = entry.element.getBoundingClientRect();
    return Math.max(0, box.top - window.innerHeight, -box.bottom);
  };
  candidates.sort((a, b) => distance(a) - distance(b));
  const entry = candidates[0];
  if (!entry) return;
  warming = entry;
  entry.attached = true;
  entry.video.preload = 'auto';
  if (entry.poster) entry.video.poster = entry.poster;
  entry.video.src = entry.source;
  retain(entry);
}

function schedulePrewarm() {
  if (prewarmQueued) return;
  prewarmQueued = true;
  // Let a route's synchronous unmounts finish before considering another load.
  queueMicrotask(() => { prewarmQueued = false; prewarm(); });
}

function refresh() {
  // Small changes at viewport edges should not repeatedly tear down a decoder.
  const priority = (entry: Entry) => Math.floor(entry.ratio * 4) + Number(entry.attached);
  const ranked = [...visible].sort((a, b) =>
    Number(b.selected) - Number(a.selected) || Number(b.manual) - Number(a.manual) || priority(b) - priority(a)
  );
  const mobile = mobileQuery?.matches ?? false;
  // Grid and Gallery share two automatic slots on phones. In the Roll the
  // camera explicitly selects three, and those must keep playing together.
  const mobileLimit = Math.max(2, ranked.filter(entry => entry.selected).length);
  const limit = document.hidden ? 0 : mobile ? mobileLimit : ranked.length;
  const next = new Set(ranked.slice(0, limit));
  if (mobile) [...retained].forEach(release);
  // Free old slots before asking WebKit for another decoder.
  for (const entry of playing) {
    if (next.has(entry)) continue;
    playing.delete(entry);
    if (mobile) release(entry); else retain(entry);
    entry.onManual(false);
  }
  for (const entry of ranked.slice(limit)) entry.onManual(!document.hidden, true);
  for (const entry of next) {
    retained.delete(entry);
    if (warming === entry) warming = undefined;
    playing.add(entry);
    entry.onManual(entry.blocked || entry.stalled);
    play(entry);
  }
  schedulePrewarm();
}

function policyChanged() {
  preloadObserver?.disconnect();
  nearby.clear();
  if (!mobileQuery?.matches) {
    entries.forEach(entry => { if (entry.active === undefined) preloadObserver?.observe(entry.element); });
  }
  refresh();
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
    mobileQuery = window.matchMedia('(hover: none) and (pointer: coarse)');
    mobileQuery.addEventListener('change', policyChanged);
    observer = new IntersectionObserver(changes => {
      changes.forEach(change => {
        const entry = entries.get(change.target);
        if (!entry || entry.active !== undefined) return;
        entry.ratio = change.intersectionRatio;
        if (change.isIntersecting && entry.ratio > 0) visible.add(entry);
        else {
          visible.delete(entry);
          entry.manual = false;
          entry.onManual(false);
        }
      });
      refresh();
    }, { threshold: [0, 0.01, 0.25, 0.5, 0.75, 1] });
    preloadObserver = new IntersectionObserver(changes => {
      changes.forEach(change => {
        const entry = entries.get(change.target);
        if (!entry || entry.active !== undefined) return;
        if (change.isIntersecting) nearby.add(entry);
        else {
          nearby.delete(entry);
          if (warming === entry) release(entry);
        }
      });
      schedulePrewarm();
    }, { rootMargin: '600px 0px' });
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('pageshow', refresh);
  }
  video.defaultMuted = true;
  video.muted = true;
  video.playsInline = true;
  const entry: Entry = { element, video, source, poster, active, ratio: active ? 1 : 0, selected: active === true, manual: false,
    attached: false, attempt: 0, pending: false, blocked: false, stalled: false, onManual };
  entries.set(element, entry);
  const ready = () => { if (wantsPlay(entry)) play(entry); schedulePrewarm(); };
  const failed = () => {
    if (wantsPlay(entry) && entry.attached && video.error) { entry.blocked = true; onManual(true); }
  };
  // An iOS player may stay in "waiting" without rejecting play() or firing error.
  // Keep its download alive, but offer a genuine user-initiated restart after 5s.
  let stalledAt = 0;
  const waiting = () => {
    if (!wantsPlay(entry) || !entry.attached || entry.blocked || entry.stallTimer || entry.stalled) return;
    stalledAt = video.currentTime;
    entry.stallTimer = setTimeout(() => {
      entry.stallTimer = undefined;
      if (wantsPlay(entry) && entry.attached && Math.abs(video.currentTime - stalledAt) < 0.01) {
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
  video.addEventListener('progress', schedulePrewarm);
  video.addEventListener('error', failed);
  onManual(false);
  if (active === undefined) {
    observer.observe(element);
    if (!mobileQuery?.matches) preloadObserver?.observe(element);
  }
  else if (active) { visible.add(entry); refresh(); }
  const setActive = (next: boolean | undefined) => {
    if (!current(entry) || next === entry.active) return;
    observer?.unobserve(element);
    preloadObserver?.unobserve(element);
    nearby.delete(entry);
    if (warming === entry) warming = undefined;
    visible.delete(entry);
    entry.active = next;
    entry.selected = next === true;
    entry.ratio = next ? 1 : 0;
    entry.manual = false;
    if (next === undefined) {
      observer?.observe(element);
      if (!mobileQuery?.matches) preloadObserver?.observe(element);
    } else if (next) visible.add(entry);
    refresh();
  };
  const dispose = () => {
    if (!current(entry)) return;
    observer?.unobserve(element);
    preloadObserver?.unobserve(element);
    entries.delete(element);
    visible.delete(entry);
    playing.delete(entry);
    nearby.delete(entry);
    video.removeEventListener('waiting', waiting);
    video.removeEventListener('stalled', waiting);
    video.removeEventListener('timeupdate', progressing);
    video.removeEventListener('canplay', ready);
    video.removeEventListener('progress', schedulePrewarm);
    video.removeEventListener('error', failed);
    release(entry);
    if (!entries.size) {
      observer?.disconnect();
      observer = undefined;
      preloadObserver?.disconnect();
      preloadObserver = undefined;
      mobileQuery?.removeEventListener('change', policyChanged);
      mobileQuery = undefined;
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('pageshow', refresh);
    } else refresh();
  };
  return { setActive, dispose };
}
