import { test } from 'node:test';
import assert from 'node:assert/strict';
import { observeVideoPlayback, requestProjectPlayback, retrySelectedPlayback } from './videoPlayback.ts';

const flush = () => new Promise(resolve => setImmediate(resolve));
class Video extends EventTarget {
  src = ''; currentTime = 0; paused = true; loads = 0; plays = 0;
  play() { this.paused = false; this.plays++; return Promise.resolve(); }
  pause() { this.paused = true; }
  load() { this.loads++; }
  removeAttribute(name) { if (name === 'src') this.src = ''; }
}
async function environment(run) {
  const originals = { document: globalThis.document, window: globalThis.window, IntersectionObserver: globalThis.IntersectionObserver };
  const doc = new EventTarget(); doc.hidden = false;
  const observers = [], cleanups = [];
  globalThis.document = doc;
  globalThis.window = Object.assign(new EventTarget(), { matchMedia: () => ({matches:true}) });
  globalThis.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; this.targets = new Set(); observers.push(this); }
    observe(target) { this.targets.add(target); }
    unobserve(target) { this.targets.delete(target); }
    disconnect() { this.targets.clear(); }
    send(target, ratio) { this.callback([{ target, intersectionRatio: ratio, isIntersecting: ratio > 0 }]); }
  };
  const observe = (target, video, active, onManual = () => {}) => {
    const cleanup = observeVideoPlayback(target, video, '/clip.mp4', active, onManual);
    cleanups.push(cleanup);
    return cleanup;
  };
  try { await run({doc, observers, observe}); }
  finally { cleanups.reverse().forEach(fn => fn()); Object.assign(globalThis, originals); }
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
