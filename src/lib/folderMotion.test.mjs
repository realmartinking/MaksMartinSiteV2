import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FolderScroll, folderPose, folderEdges, wrapProject } from './folderMotion.ts';
const metrics = { width: 1440, height: 810, cardWidth: 583.2, cardHeight: 328.05 };

function gesture(deltas, stride = 445.5) {
  const scroll = new FolderScroll();
  let target = 0;
  deltas.forEach((delta, i) => { target = scroll.push(delta, i * 16, target, stride); });
  return { target, snapped: scroll.snap(target) };
}

test('small gestures move immediately and finish exactly one project ahead', () => {
  const result = gesture([20,10,5,2,1]);
  assert.ok(result.target > 0 && result.target < 1);
  assert.equal(result.snapped, 1);
});
test('a full viewport gesture settles on two projects', () => {
  assert.equal(gesture(Array(15).fill(54)).snapped, 2);
});
test('continued input is never discarded after two projects', () => {
  const result = gesture(Array(80).fill(25));
  assert.ok(result.target > 4);
  assert.equal(result.snapped, 4);
});
test('packet coalescing does not change travel distance', () => {
  assert.ok(Math.abs(gesture([810]).target - gesture(Array(30).fill(27)).target) < 1e-10);
});
test('new input and reversals work while the previous animation is unfinished', () => {
  const scroll = new FolderScroll();
  let target = scroll.push(40, 0, 0, 450);
  target = scroll.snap(target);
  assert.equal(target, 1);
  target = scroll.push(40, 250, target, 450);
  assert.equal(scroll.snap(target), 2);
  target = scroll.push(-80, 280, target, 450);
  assert.equal(scroll.snap(target), 0);
});
test('resting files overlap to form strips without flattening the whole video', () => {
  for (let i=-8;i<8;i++) {
    const a=folderPose(i,metrics), b=folderPose(i+1,metrics);
    const edges=folderEdges(a,metrics.cardHeight), next=folderEdges(b,metrics.cardHeight);
    assert.ok(a.y < b.y && a.scale < b.scale);
    assert.ok(next.top < edges.bottom);
    assert.ok(Math.cos(a.angle*Math.PI/180) > 0.65);
    assert.ok(next.top-edges.top < (edges.bottom-edges.top)*0.4);
  }
});
test('only the selected file unfolds and both parts of the stack change angle', () => {
  assert.equal(folderPose(0,metrics,1).angle,0);
  assert.equal(folderPose(0,metrics,1).y,0);
  for (const i of [-3,-2,-1,1,2,3]) {
    assert.notEqual(folderPose(i,metrics,1).angle,0);
    assert.notEqual(folderPose(i,metrics,1).angle,folderPose(i,metrics).angle);
  }
});
test('opening gradually reveals the selected card and finishes with clear edges', () => {
  let lastVisible=0;
  for (let opening=0;opening<=1.001;opening+=.025) {
    const selected=folderEdges(folderPose(0,metrics,opening),metrics.cardHeight);
    const front=folderEdges(folderPose(1,metrics,opening),metrics.cardHeight);
    const visible=(Math.min(selected.bottom,front.top)-selected.top)/(selected.bottom-selected.top);
    assert.ok(visible >= lastVisible-0.0001, `opening ${opening}`);
    lastVisible=visible;
  }
  const selected=folderEdges(folderPose(0,metrics,1),metrics.cardHeight);
  for (let i=1;i<=5;i++) {
    assert.ok(folderEdges(folderPose(i,metrics,1),metrics.cardHeight).top>selected.bottom);
    assert.ok(folderEdges(folderPose(-i,metrics,1),metrics.cardHeight).bottom<selected.top);
  }
});
test('infinite selection wraps in both directions', () => {
  assert.deepEqual([-2,-1,0,1,2,3,4,5].map(i=>wrapProject(i,4)),[2,3,0,1,2,3,0,1]);
});
