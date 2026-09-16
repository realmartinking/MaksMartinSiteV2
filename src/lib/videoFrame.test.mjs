import { test } from 'node:test';
import assert from 'node:assert/strict';
import { observeVideoFrame } from './videoFrame.ts';

function setup(run) {
  const originals={requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};
  let id=0;const raf=new Map();
  globalThis.requestAnimationFrame=fn=>{raf.set(++id,fn);return id;};
  globalThis.cancelAnimationFrame=id=>raf.delete(id);
  const tick=()=>{const pending=[...raf.values()];raf.clear();pending.forEach(fn=>fn());};
  try { run({raf,tick}); } finally { Object.assign(globalThis,originals); }
}
test('poster stays until a composited frame, returns on eviction, and callbacks are cleaned up',()=>setup(()=>{
  const video=new EventTarget();video.readyState=0;video.paused=true;
  let id=0;const callbacks=new Map(),states=[];
  video.requestVideoFrameCallback=fn=>{callbacks.set(++id,fn);return id;};
  video.cancelVideoFrameCallback=id=>callbacks.delete(id);
  const paint=()=>{const pending=[...callbacks.values()];callbacks.clear();pending.forEach(fn=>fn());};
  const dispose=observeVideoFrame(video,ready=>states.push(ready));
  video.readyState=1;video.dispatchEvent(new Event('loadedmetadata'));
  assert.deepEqual(states,[false]);
  video.readyState=2;paint();assert.deepEqual(states,[false],'a paused preload frame must keep the cover');
  video.paused=false;video.dispatchEvent(new Event('playing'));
  assert.deepEqual(states,[false],'playing alone must not hide the cover');
  paint();assert.deepEqual(states,[false,true]);
  video.readyState=0;video.dispatchEvent(new Event('emptied'));assert.equal(states.at(-1),false);
  video.readyState=2;video.dispatchEvent(new Event('loadeddata'));paint();assert.equal(states.at(-1),true);
  video.dispatchEvent(new Event('error'));video.dispatchEvent(new Event('loadeddata'));
  dispose();assert.equal(callbacks.size,0);
}));
test('older browsers wait for actual playback and two paint opportunities',()=>setup(({raf,tick})=>{
  const video=new EventTarget();video.readyState=2;video.paused=true;
  const states=[];const dispose=observeVideoFrame(video,v=>states.push(v));
  video.dispatchEvent(new Event('loadeddata'));assert.equal(raf.size,0);
  video.paused=false;video.dispatchEvent(new Event('playing'));
  tick();assert.deepEqual(states,[false]);tick();assert.deepEqual(states,[false,true]);
  dispose();assert.equal(raf.size,0);
}));
