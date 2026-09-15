import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FolderGesture, folderPose, wrapProject } from './folderMotion.ts';

test('a light wheel gesture advances one project, including its momentum tail', () => {
  const gesture = new FolderGesture();
  const events = [30, 20, 10, 5, 2, 1];
  assert.equal(events.reduce((steps, delta, index) => steps + gesture.push(delta, index * 20), 0), 1);
});

test('a long strong gesture never consumes more than two projects', () => {
  const gesture = new FolderGesture();
  const steps = Array.from({ length: 90 }, (_, index) => gesture.push(60, index * 16));
  assert.equal(steps.reduce((a, b) => a + b), 2);
});

test('tiny reverse noise in a momentum tail does not re-arm the gesture', () => {
  const gesture = new FolderGesture();
  const events = [30, 10, -1, 30, -2, 20, 2];
  assert.equal(events.reduce((steps, delta, index) => steps + gesture.push(delta, index * 20), 0), 1);
});

test('coalesced wheel input and small packets have the same two-project budget', () => {
  const coalesced = new FolderGesture();
  const packets = new FolderGesture();
  assert.equal(coalesced.push(480, 0), 2);
  assert.equal(Array.from({ length: 16 }, (_, index) => packets.push(30, index * 10)).reduce((a, b) => a + b), 2);
});

test('a fresh gesture and a deliberate reversal both work without waiting for animation', () => {
  const gesture = new FolderGesture();
  assert.equal(gesture.push(60, 0), 1);
  assert.equal(gesture.push(60, 300), 1);
  assert.equal(gesture.push(-60, 330), -1);
});

test('the stack recedes monotonically with no opening or perspective discontinuities', () => {
  for (let index = -6; index < 6; index++) {
    const a = folderPose(index, 900), b = folderPose(index + 1, 900);
    assert.ok(a.y < b.y);
    assert.ok(a.z < b.z);
    assert.equal(a.rotateX, b.rotateX);
  }
});

test('the project cycle continues in both directions without an end', () => {
  assert.deepEqual([-2,-1,0,1,2,3,4,5].map(index => wrapProject(index,4)), [2,3,0,1,2,3,0,1]);
  assert.equal(wrapProject(10004,4),0);
});
