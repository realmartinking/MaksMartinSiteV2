import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FolderScroll, folderPose, folderEdges, folderMediaScale, wrapProject } from './folderMotion.ts';
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
test('opening gradually reveals the selected card and leaves air below it', () => {
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
    assert.ok(folderEdges(folderPose(i,metrics,1),metrics.cardHeight).top>=selected.bottom+metrics.height*.025-0.001);
  }
});
test('rear files straighten, diminish with depth and continue behind the selection', () => {
  for (let i=1;i<=6;i++) {
    const rear=folderPose(-i,metrics,1), nearer=folderPose(1-i,metrics,1);
    const edges=folderEdges(rear,metrics.cardHeight), next=folderEdges(nearer,metrics.cardHeight);
    assert.ok(Math.abs(rear.angle)<=10);
    assert.ok(rear.scale<nearer.scale);
    assert.ok(edges.top<next.top && edges.bottom>next.top, 'upper strips occlude full rear cards');
  }
});
test('closed stack shows at most ten strips throughout a scroll step', () => {
  for (let phase=0;phase<1;phase+=.01) {
    let visible=0;
    for (let i=-10;i<=10;i++) {
      const edges=folderEdges(folderPose(i-phase,metrics),metrics.cardHeight);
      const next=folderEdges(folderPose(i+1-phase,metrics),metrics.cardHeight);
      if (edges.top<metrics.height/2 && Math.min(edges.bottom,next.top)>-metrics.height/2) visible++;
    }
    assert.ok(visible<=10, `${visible} strips at ${phase}`);
    if (phase===0) assert.equal(visible,10);
  }
});
test('opened foreground fits exactly three strips across desktop aspect ratios', () => {
  for (const [width,height] of [[1280,800],[1440,810],[1920,1080],[2560,1080],[1440,1000]]) {
    const cardWidth=Math.min(width*.405,height*.95);
    const size={width,height,cardWidth,cardHeight:cardWidth*9/16};
    for (let i=1;i<=3;i++) assert.ok(folderEdges(folderPose(i,size,1),size.cardHeight).top<height/2);
    assert.ok(folderEdges(folderPose(4,size,1),size.cardHeight).top>=height/2);
  }
});
test('infinite selection wraps in both directions', () => {
  assert.deepEqual([-2,-1,0,1,2,3,4,5].map(i=>wrapProject(i,4)),[2,3,0,1,2,3,0,1]);
  assert.deepEqual([-1,0,7,8,17].map(i=>wrapProject(i,8)),[7,0,7,0,1]);
});
test('blur overscan keeps the transparent fringe outside every edge throughout opening', () => {
  for (const [width,height] of [[265,149],[583.2,328.05],[1036.8,583.2]]) {
    assert.equal(folderMediaScale(0,width,height),1);
    for (let blur=.05;blur<=5;blur+=.05) {
      const scale=folderMediaScale(blur,width,height);
      for (const dimension of [width,height]) {
        const sourceInset=dimension*(scale-1)/(2*scale);
        assert.ok(sourceInset>=3.5*blur-1e-9, 'crop falls inside opaque filtered pixels');
      }
    }
  }
  assert.equal(folderMediaScale(5,0,0),1);
  assert.ok(Number.isFinite(folderMediaScale(5,10,5)));
});
