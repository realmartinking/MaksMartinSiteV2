import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rollStride } from './rollMotion.ts';

test('landscape desktop keeps its existing Roll spacing', () => {
  assert.equal(rollStride(800, 1422*.535*9/16), 800*.58);
  assert.equal(rollStride(1080, 1920*.535*9/16), 1080*.58);
});
test('portrait windows retain space for visible neighbours and a clear central card', () => {
  for (const [width,height,factor,center] of [[390,844,.88,.6],[768,1024,.88,.6],[906,1120,.535,.5]]) {
    const cardHeight=width*factor*9/16;
    const step=rollStride(height,cardHeight);
    assert.ok(step>cardHeight, 'central full video has room');
    assert.ok(height*center-step>0, 'previous card center remains in the viewport');
    assert.ok(height*center+step-cardHeight*.23<height, 'next tilted card remains partly in the viewport');
  }
});
