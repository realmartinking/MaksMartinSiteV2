import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scrollBlend } from './scrollTuning.ts';

test('weighted scrolling travels the same distance at 30, 60 and 120Hz', () => {
  const results=[30,60,120].map(fps=>{
    let position=0;
    for(let i=0;i<fps;i++)position+=(1000-position)*scrollBlend(1000/fps);
    return position;
  });
  assert.ok(Math.max(...results)-Math.min(...results)<1e-8);
  assert.ok(results[0]>900 && results[0]<930, 'longer tail without a locked gesture');
});
test('interrupting an unfinished scroll immediately reverses its direction', () => {
  let position=500;
  position+=(0-position)*scrollBlend(1000/60);
  assert.ok(position<500 && position>0);
});
