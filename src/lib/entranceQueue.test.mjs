import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EntranceQueue } from './entranceQueue.ts';

test('repeat projects appended in separate callbacks keep the initial stagger', () => {
  const queue = new EntranceQueue(true);
  const first = Array.from({length:8}, () => queue.delay(100));
  const repeated = Array.from({length:4}, () => queue.delay(160));
  assert.deepEqual(first,[0,.08,.16,.24,.32,.4,.48,.56]);
  assert.deepEqual(repeated,[.64,.72,.8,.88]);
});
test('appending just after the preloader does not jump ahead of waiting projects', () => {
  const queue = new EntranceQueue(true);
  for (let i=0;i<8;i++) queue.delay(100);
  queue.releaseIntro(2700);
  assert.equal(queue.delay(2800),.54);
});
test('scrolling into a later group starts a fresh sequence without growing delays', () => {
  const queue = new EntranceQueue(false);
  for (let i=0;i<18;i++) queue.delay(1000);
  assert.equal(queue.delay(7000),0);
  assert.equal(queue.delay(7000),.08);
  assert.equal(queue.delay(7050),.11);
});
