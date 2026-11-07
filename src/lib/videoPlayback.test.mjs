import { test } from 'node:test';
import assert from 'node:assert/strict';
import { observeVideoPlayback, requestProjectPlayback, retrySelectedPlayback } from './videoPlayback.ts';

const flush = () => new Promise(resolve => setImmediate(resolve));
class Video extends EventTarget {
  _src = ''; currentTime = 0; paused = true; loads = 0; plays = 0; sources = 0; readyState = 4;
  duration = 10; bufferedEnd = 10;
  buffered = {length: 1, start: () => 0, end: () => this.bufferedEnd};
  get src() { return this._src; }
  set src(value) { this._src = value; this.currentTime = 0; this.sources++; }
  play() { this.paused = false; this.plays++; return Promise.resolve(); }
  pause() { this.paused = true; }
  load() { this.loads++; this.currentTime = 0; this.dispatchEvent(new Event('emptied')); }
  removeAttribute(name) { if (name === 'src') this._src = ''; }
}
async function environment(run, { mobile = true, connection } = {}) {
  const originals = { document: globalThis.document, window: globalThis.window, IntersectionObserver: globalThis.IntersectionObserver };
  const doc = new EventTarget(); doc.hidden = false;
  const observers = [], cleanups = [];
  globalThis.document = doc;
  const query = Object.assign(new EventTarget(), { matches: mobile });
  globalThis.window = Object.assign(new EventTarget(), { matchMedia: () => query, navigator: { connection }, innerHeight: 900 });
  globalThis.IntersectionObserver = class {
    constructor(callback, options) { this.callback = callback; this.options = options; this.targets = new Set(); observers.push(this); }
    observe(target) { this.targets.add(target); }
    unobserve(target) { this.targets.delete(target); }
    disconnect() { this.targets.clear(); }
    send(target, ratio) { this.callback([{ target, intersectionRatio: ratio, isIntersecting: ratio > 0 }]); }
  };
  const observe = (target, video, active, onManual = () => {}, source = '/clip.mp4') => {
    const controller = observeVideoPlayback(target, video, source, active, onManual);
    const cleanup = Object.assign(controller.dispose, { setActive: controller.setActive });
    cleanups.push(cleanup);
    return cleanup;
  };
  try { await run({doc, observers, observe, query}); }
  finally { cleanups.reverse().forEach(fn => fn()); await flush(); Object.assign(globalThis, originals); }
}

test('offscreen copies have no source, relinquish buffers on exit, and resume upon return', () => environment(async ({doc, observers, observe}) => {
  const a = {}, b = {}, first = new Video(), second = new Video();
  observe(a, first); observe(b, second);
  assert.equal(first.src, ''); assert.equal(second.src, '');
  const viewport = observers[0];
  viewport.send(a, 1); await flush();
  assert.equal(first.src, '/clip.mp4'); assert.equal(first.paused, false);
  assert.equal(second.loads, 0);
  viewport.send(a, 0);
  assert.equal(first.src, ''); assert.equal(first.paused, true); assert.equal(first.loads, 1);
  viewport.send(a, 1); await flush(); assert.equal(first.plays, 2);
  doc.hidden = true; doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(first.src, '');
  doc.hidden = false; doc.dispatchEvent(new Event('visibilitychange')); await flush();
  assert.equal(first.paused, false);
}));

test('Gallery reserves two mobile slots; tapping a third transfers playback', () => environment(async ({observers, observe}) => {
  const tiles = Array.from({length: 3}, () => ({el: {}, video: new Video(), manual: false}));
  for (const tile of tiles) observe(tile.el, tile.video, undefined, value => { tile.manual = value; });
  tiles.forEach(tile => observers[0].send(tile.el, 1));
  assert.deepEqual(tiles.map(tile => tile.video.src), ['/clip.mp4', '/clip.mp4', '']);
  assert.equal(tiles[2].manual, true);
  requestProjectPlayback(tiles[2].el); await flush();
  assert.equal(tiles[2].video.paused, false); assert.equal(tiles[2].manual, false);
  assert.equal(tiles.filter(tile => tile.video.src).length, 2);
}));

test('Roll plays three mobile neighbours and retries blocked clips in one gesture', () => environment(async ({doc, observe}) => {
  const videos = Array.from({length: 4}, () => new Video());
  const manual = [false, false, false];
  const cleanups = videos.slice(0, 3).map((video, index) => {
    if (index > 0) video.play = function () {
      if (++this.plays === 1) return Promise.reject(Object.assign(new Error(), {name:'NotAllowedError'}));
      this.paused = false;
      return Promise.resolve();
    };
    return observe({}, video, true, value => { manual[index] = value; });
  });
  await flush();
  assert.deepEqual(manual, [false, true, true]);
  retrySelectedPlayback({ contains: () => true });
  await flush();
  assert.deepEqual(manual, [false, false, false]);
  assert.ok(videos.slice(0, 3).every(v => !v.paused));
  assert.equal(videos[0].plays, 1);
  cleanups[0]();
  observe({}, videos[3], true);
  assert.deepEqual(videos.map(v => v.src), ['', '/clip.mp4', '/clip.mp4', '/clip.mp4']);
  assert.deepEqual(videos.map(v => v.loads), [1, 0, 0, 0]);
  doc.hidden = true; doc.dispatchEvent(new Event('visibilitychange'));
  assert.ok(videos.every(v => !v.src && v.paused));
  doc.hidden = false; doc.dispatchEvent(new Event('visibilitychange')); await flush();
  assert.deepEqual(videos.map(v => v.paused), [true, false, false, false]);
}));

test('autoplay denial does not spin and an explicit tap retries just that preview', () => environment(async ({observe}) => {
  const target = {}, video = new Video(), manual = [];
  video.play = function () {
    this.plays++;
    if (this.plays === 1) return Promise.reject(Object.assign(new Error(), { name: 'NotAllowedError' }));
    this.paused = false;
    return Promise.resolve();
  };
  observe(target, video, true, state => manual.push(state)); await flush();
  video.dispatchEvent(new Event('canplay')); assert.equal(video.plays, 1);
  assert.equal(manual.at(-1), true);
  requestProjectPlayback(target); await flush();
  assert.equal(video.plays, 2); assert.equal(video.paused, false); assert.equal(manual.at(-1), false);
}));

test('an obsolete interrupted play cannot disturb a recycled player', () => environment(async ({observers, observe}) => {
  const target = {}, video = new Video(); let reject;
  video.play = function () {
    this.plays++; this.paused = false;
    return this.plays === 1 ? new Promise((_, no) => { reject = no; }) : Promise.resolve();
  };
  observe(target, video);
  const viewport = observers[0];
  viewport.send(target, 1); viewport.send(target, 0); viewport.send(target, 1);
  reject(Object.assign(new Error(), { name: 'AbortError' })); await flush();
  assert.equal(video.plays, 2); assert.equal(video.paused, false);
}));

test('explicit List and Folder selection does not grant slots to hidden copies', () => environment(async ({observers, observe}) => {
  const target = {}, video = new Video();
  const cleanup = observe(target, video, false);
  video.dispatchEvent(new Event('canplay')); assert.equal(video.plays, 0);
  assert.equal(observers[0].targets.size, 0); assert.equal(video.src, '');
  cleanup(); observe(target, video, true); await flush(); assert.equal(video.plays, 1);
  video.paused = true; video.dispatchEvent(new Event('canplay')); await flush(); assert.equal(video.plays, 2);
}));

test('buffering exposes retry after five seconds without discarding slow downloads', async t => {
  t.mock.timers.enable({apis:['setTimeout']});
  await environment(async ({observe}) => {
    const el = {}, video = new Video(), manual = [];
    observe(el, video, true, value => manual.push(value)); await flush();
    video.dispatchEvent(new Event('waiting'));
    t.mock.timers.tick(4000);
    video.currentTime = 0.5; video.dispatchEvent(new Event('timeupdate'));
    t.mock.timers.tick(1000); assert.equal(manual.at(-1), false);
    video.dispatchEvent(new Event('waiting')); t.mock.timers.tick(5000);
    assert.equal(manual.at(-1), true); assert.equal(video.loads, 0);
    video.currentTime = 0.8; video.dispatchEvent(new Event('timeupdate'));
    assert.equal(manual.at(-1), false);
    video.dispatchEvent(new Event('stalled')); t.mock.timers.tick(5000);
    requestProjectPlayback(el);
    assert.equal(video.loads, 1); assert.equal(video.plays, 2);
    assert.equal(manual.at(-1), false);
  });
});

test('desktop tab round-trip pauses without resetting source, frame or position', () => environment(async ({doc, observe}) => {
  const video = new Video();
  observe({}, video, true); await flush(); video.currentTime = 7.25;
  doc.hidden = true; doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(video.paused, true); assert.equal(video.src, '/clip.mp4');
  assert.equal(video.currentTime, 7.25); assert.equal(video.loads, 0);
  video.dispatchEvent(new Event('canplay')); await flush();
  assert.equal(video.plays, 1); assert.equal(video.paused, true);
  doc.hidden = false; doc.dispatchEvent(new Event('visibilitychange')); await flush();
  assert.equal(video.paused, false); assert.equal(video.currentTime, 7.25);
  assert.equal(video.sources, 1); assert.equal(video.loads, 0);
}, {mobile: false}));

test('desktop selection updates preserve a retained movie and overlapping Roll neighbours', () => environment(async ({observe, observers}) => {
  const videos = Array.from({length: 4}, () => new Video());
  const controls = videos.map((video, index) => observe({}, video, index < 3));
  await flush(); videos.forEach((video, index) => { video.currentTime = index + 5; });
  controls[0].setActive(false); controls[3].setActive(true); await flush();
  videos[0].dispatchEvent(new Event('canplay')); await flush();
  assert.equal(videos[0].paused, true); assert.equal(videos[0].currentTime, 5);
  assert.deepEqual(videos.slice(1, 3).map(video => video.plays), [1, 1]);
  assert.deepEqual(videos.slice(1, 3).map(video => video.currentTime), [6, 7]);
  controls[0].setActive(true); controls[3].setActive(false); await flush();
  assert.equal(videos[0].currentTime, 5); assert.equal(videos[0].sources, 1);
  assert.equal(videos[0].loads, 0); assert.equal(videos[0].paused, false);
  assert.equal(observers[1].targets.size, 0, 'hidden explicit alternatives are not prewarmed');
}, {mobile: false}));

test('late desktop play completion and ready events cannot restart an offscreen movie', () => environment(async ({observe, observers}) => {
  const target = {}, video = new Video(); let finish;
  video.play = function () {
    this.plays++; this.paused = false;
    if (this.plays > 1) return Promise.resolve();
    return new Promise(resolve => { finish = () => { this.paused = false; resolve(); }; });
  };
  observe(target, video);
  observers[0].send(target, 1); video.currentTime = 3.5;
  observers[0].send(target, 0);
  finish(); await flush(); video.dispatchEvent(new Event('canplay')); await flush();
  assert.equal(video.paused, true); assert.equal(video.plays, 1);
  assert.equal(video.src, '/clip.mp4'); assert.equal(video.loads, 0);
  observers[0].send(target, 1); await flush();
  assert.equal(video.paused, false); assert.equal(video.currentTime, 3.5); assert.equal(video.sources, 1);
}, {mobile: false}));

test('late rejected playback and stale stall timers stay quiet after desktop deselection', async t => {
  t.mock.timers.enable({apis:['setTimeout']});
  await environment(async ({observe}) => {
    const video = new Video(), manual = []; let reject;
    video.play = function () {
      this.plays++; this.paused = false;
      return new Promise((_, no) => { reject = no; });
    };
    const control = observe({}, video, true, value => manual.push(value));
    video.dispatchEvent(new Event('waiting'));
    control.setActive(false);
    reject(Object.assign(new Error(), {name:'AbortError'})); await flush();
    t.mock.timers.tick(6000); video.dispatchEvent(new Event('canplay'));
    assert.equal(video.plays, 1); assert.equal(video.paused, true); assert.equal(manual.at(-1), false);
  }, {mobile: false});
});

test('desktop retains at most six inactive buffers and releases them on cleanup', () => environment(async ({observe}) => {
  const videos = Array.from({length: 9}, () => new Video()), controls = [];
  for (const [index, video] of videos.entries()) {
    const control = observe({}, video, true); controls.push(control);
    await flush(); video.currentTime = index + 1;
    control.setActive(false);
    assert.ok(videos.filter(value => value.src && value.paused).length <= 6);
  }
  assert.deepEqual(videos.map(video => !!video.src), [false, false, false, true, true, true, true, true, true]);
  controls[8].setActive(true); await flush();
  assert.equal(videos[8].currentTime, 9); assert.equal(videos[8].sources, 1);
  controls[0].setActive(true); await flush();
  assert.equal(videos[0].currentTime, 0); assert.equal(videos[0].sources, 2, 'evicted clips reload on return');
  controls.forEach(control => control());
  assert.ok(videos.every(video => !video.src && video.paused));
}, {mobile: false}));

test('disposing a source releases it and an old play promise cannot pause its replacement', () => environment(async ({observe}) => {
  const target = {}, video = new Video(); let resolve;
  video.play = function () {
    this.plays++; this.paused = false;
    return this.plays === 1 ? new Promise(yes => { resolve = yes; }) : Promise.resolve();
  };
  const first = observe(target, video, true);
  first();
  assert.equal(video.src, ''); assert.equal(video.loads, 1);
  observe(target, video, true, () => {}, '/replacement.mp4');
  video.currentTime = 2;
  resolve(); await flush();
  assert.equal(video.src, '/replacement.mp4'); assert.equal(video.paused, false); assert.equal(video.currentTime, 2);
}, {mobile: false}));

test('desktop warms one nearest movie only after every visible loop is fully buffered', () => environment(async ({observe, observers}) => {
  const foreground = new Video(); foreground.readyState = 2; foreground.bufferedEnd = 1;
  const active = {}; observe(active, foreground);
  observers[0].send(active, 1);
  const second = new Video(); second.bufferedEnd = 2;
  const otherActive = {}; observe(otherActive, second); observers[0].send(otherActive, 1);
  const targets = [1100, 950, 1300].map(top => ({getBoundingClientRect: () => ({top, bottom: top + 100})}));
  const videos = targets.map(target => { const video = new Video(); observe(target, video); return video; });
  targets.forEach(target => observers[1].send(target, 1)); await flush();
  assert.ok(videos.every(video => !video.src), 'foreground download has priority');
  foreground.readyState = 3; foreground.dispatchEvent(new Event('canplay')); await flush();
  assert.ok(videos.every(video => !video.src), 'HAVE_FUTURE_DATA with a small buffer is not enough');
  foreground.bufferedEnd = foreground.duration; foreground.dispatchEvent(new Event('progress')); await flush();
  assert.ok(videos.every(video => !video.src), 'all currently playing loops must finish buffering');
  second.bufferedEnd = second.duration; second.dispatchEvent(new Event('progress')); await flush();
  assert.deepEqual(videos.map(video => !!video.src), [false, true, false]);
  assert.equal(videos[1].preload, 'auto'); assert.equal(videos[1].plays, 0);
  videos[1].dispatchEvent(new Event('canplay')); await flush();
  assert.deepEqual(videos.map(video => !!video.src), [false, true, false], 'a finished prewarm does not start a chain');
  observers[0].send(targets[1], 1); await flush();
  assert.equal(videos[1].sources, 1); assert.equal(videos[1].paused, false);
  assert.deepEqual(videos.map(video => !!video.src), [true, true, false]);
}, {mobile: false}));

test('prewarm honours slow connections and Save-Data', async () => {
  for (const connection of [{saveData:true}, {effectiveType:'slow-2g'}, {effectiveType:'2g'}, {effectiveType:'3g'}]) {
    await environment(async ({observe, observers}) => {
      const target = {getBoundingClientRect: () => ({top: 1000, bottom: 1100})}, video = new Video();
      observe(target, video); observers[1].send(target, 1); await flush();
      assert.equal(video.src, ''); assert.equal(video.plays, 0);
    }, {mobile:false, connection});
  }
});

test('mobile selection still releases immediately and does not prewarm', () => environment(async ({observe, observers}) => {
  const video = new Video(), control = observe({}, video, true);
  await flush(); video.currentTime = 4;
  control.setActive(false);
  assert.equal(video.src, ''); assert.equal(video.currentTime, 0); assert.equal(video.loads, 1);
  control.setActive(true); await flush();
  assert.equal(video.sources, 2); assert.equal(video.paused, false);
  observe({}, new Video());
  assert.equal(observers[1].targets.size, 0);
}));

test('switching to touch policy releases retained desktop buffers', () => environment(async ({observe, query}) => {
  const video = new Video(), control = observe({}, video, true);
  await flush(); control.setActive(false);
  assert.equal(video.src, '/clip.mp4');
  query.matches = true; query.dispatchEvent(new Event('change'));
  assert.equal(video.src, ''); assert.equal(video.loads, 1);
}, {mobile:false}));
