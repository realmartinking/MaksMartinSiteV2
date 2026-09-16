import { test } from 'node:test';
import assert from 'node:assert/strict';
import { observeVideoPlayback } from './videoPlayback.ts';

const flush = () => new Promise(resolve => setImmediate(resolve));
class Video extends EventTarget {
  src = '/projects/test.mp4'; preload = 'none'; paused = true; loads = 0; plays = 0;
  play() { this.paused = false; this.plays++; return Promise.resolve(); }
  pause() { this.paused = true; }
  load() { this.loads++; }
}
async function environment(run) {
  const originals = { document: globalThis.document, window: globalThis.window, IntersectionObserver: globalThis.IntersectionObserver };
  const doc = new EventTarget(); doc.hidden = false;
  const observers = [], cleanups = [];
  globalThis.document = doc;
  globalThis.window = new EventTarget();
  globalThis.IntersectionObserver = class {
    constructor(callback, options) { this.callback = callback; this.options = options; this.targets = new Set(); observers.push(this); }
    observe(target) { this.targets.add(target); }
    unobserve(target) { this.targets.delete(target); }
    disconnect() { this.targets.clear(); }
    send(target, isIntersecting) { this.callback([{ target, isIntersecting }]); }
  };
  const observe = (...args) => { const cleanup=observeVideoPlayback(...args); cleanups.push(cleanup); return cleanup; };
  try { await run({doc, observers, observe}); }
  finally { cleanups.reverse().forEach(fn=>fn()); Object.assign(globalThis, originals); }
}

test('warming never resets video in either observer callback order', () => environment(async ({doc,observers,observe}) => {
  for (const playFirst of [false,true]) {
    const target={}, video=new Video();
    const cleanup=observe(target,video);
    const [playback,preload]=observers.slice(-2);
    if(playFirst)playback.send(target,true);
    preload.send(target,true);
    if(!playFirst)playback.send(target,true);
    await flush();
    assert.equal(video.loads,0,'load() would discard buffered data / abort play');
    assert.equal(video.preload,'auto');
    assert.equal(video.paused,false);
    playback.send(target,true);
    assert.equal(video.plays,1);
    doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));
    assert.equal(video.paused,true);
    doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));await flush();
    assert.equal(video.paused,false);
    playback.send(target,false);assert.equal(video.paused,true);
    cleanup();assert.equal(playback.targets.size,0);assert.equal(preload.targets.size,0);
  }
}));
test('a quick leave/re-enter recovers an interrupted pending play without another intersection', () => environment(async ({observers,observe}) => {
  const target={}, video=new Video();let reject;
  video.play=function(){this.plays++;this.paused=false;return this.plays===1?new Promise((_,no)=>reject=no):Promise.resolve();};
  observe(target,video);
  const playback=observers[0];
  playback.send(target,true);playback.send(target,false);playback.send(target,true);
  assert.equal(video.plays,1);
  reject(Object.assign(new Error('interrupted'),{name:'AbortError'}));await flush();
  assert.equal(video.plays,2);assert.equal(video.paused,false);
}));
test('policy denial does not spin; a later user gesture can resume the visible video', () => environment(async ({doc,observe}) => {
  const video=new Video();
  video.play=function(){this.plays++;if(this.plays===1)return Promise.reject(Object.assign(new Error(),{name:'NotAllowedError'}));this.paused=false;return Promise.resolve();};
  observe({},video,true);await flush();
  assert.equal(video.plays,1);
  doc.dispatchEvent(new Event('pointerup'));await flush();
  assert.equal(video.plays,2);assert.equal(video.paused,false);
}));
test('List owns its preview and canplay recovers a paused visible video', () => environment(async ({observers,observe}) => {
  const target={}, video=new Video();
  const cleanup=observe(target,video,false);
  video.dispatchEvent(new Event('canplay'));assert.equal(video.plays,0);
  assert.equal(observers[0].targets.size,0);
  cleanup();observe(target,video,true);await flush();assert.equal(video.plays,1);
  video.paused=true;video.dispatchEvent(new Event('canplay'));await flush();assert.equal(video.plays,2);
}));
test('an obsolete pending play cannot pause a remounted player', () => environment(async ({observe}) => {
  const target={},video=new Video();let resolve;
  video.play=function(){this.plays++;this.paused=false;return this.plays===1?new Promise(yes=>resolve=yes):Promise.resolve();};
  const cleanup=observe(target,video,true);cleanup();observe(target,video,true);
  resolve();await flush();assert.equal(video.paused,false);
}));
test('offscreen repeats do not each buffer the same movie, and the owner transfers on recycling', () => environment(async ({observe,observers}) => {
  const a={},b={},first=new Video(),second=new Video();
  const cleanup=observe(a,first);observe(b,second);
  assert.equal(first.preload,'metadata');assert.equal(second.preload,'none');
  const [playback,preload]=observers;
  preload.send(a,true);preload.send(b,true);
  assert.equal(first.preload,'auto');assert.equal(second.preload,'none');
  cleanup();assert.equal(second.preload,'auto');
  playback.send(b,true);await flush();assert.equal(second.paused,false);
  assert.equal(second.loads,0);
}));
