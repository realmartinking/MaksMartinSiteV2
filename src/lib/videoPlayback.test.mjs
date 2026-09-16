import { test } from 'node:test';
import assert from 'node:assert/strict';
import { observeVideoPlayback } from './videoPlayback.ts';

test('preloading and playback remain safe in either observer callback order', async () => {
  const observers = [];
  const doc = new EventTarget();
  doc.hidden = false;
  const oldDocument = globalThis.document;
  const oldObserver = globalThis.IntersectionObserver;
  globalThis.document = doc;
  globalThis.IntersectionObserver = class {
    constructor(callback, options) { this.callback = callback; this.options = options; this.targets = new Set(); observers.push(this); }
    observe(target) { this.targets.add(target); }
    unobserve(target) { this.targets.delete(target); }
    disconnect() { this.targets.clear(); }
    send(target, isIntersecting) { this.callback([{ target, isIntersecting }]); }
  };
  let cleanup;
  try {
    for (const playFirst of [false, true]) {
      const target = {};
      const video = {
        preload: 'none', paused: true, loads: 0, plays: 0,
        play() { this.paused = false; this.plays++; return Promise.resolve(); },
        pause() { this.paused = true; },
        load() { this.loads++; },
      };
      cleanup = observeVideoPlayback(target, video);
      const [playback, preload] = observers.slice(-2);
      assert.notEqual(playback.options.rootMargin, preload.options.rootMargin);
      if (playFirst) playback.send(target, true);
      preload.send(target, true);
      if (!playFirst) playback.send(target, true);
      await Promise.resolve();
      assert.equal(video.loads, playFirst ? 0 : 1, 'preload must not reset active playback');
      assert.equal(video.paused, false);
      playback.send(target, true);
      assert.equal(video.plays, 1, 'redundant intersections do not restart playback');
      doc.hidden = true;
      doc.dispatchEvent(new Event('visibilitychange'));
      assert.equal(video.paused, true);
      doc.hidden = false;
      doc.dispatchEvent(new Event('visibilitychange'));
      await Promise.resolve();
      assert.equal(video.paused, false);
      playback.send(target, false);
      assert.equal(video.paused, true);
      cleanup(); cleanup = undefined;
      assert.equal(playback.targets.size, 0);
      assert.equal(preload.targets.size, 0);
    }
  } finally {
    cleanup?.();
    globalThis.document = oldDocument;
    globalThis.IntersectionObserver = oldObserver;
  }
});
