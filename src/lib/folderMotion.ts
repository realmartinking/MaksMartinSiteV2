/** Wheel input stays continuous; only the end of a gesture snaps to a project. */
export class FolderScroll {
  private lastTime = -Infinity;
  private direction = 0;
  private anchor = 0;
  private distance = 0;

  reset() { this.lastTime = -Infinity; this.direction = 0; this.distance = 0; }

  push(delta: number, time: number, target: number, stride: number) {
    if (Math.abs(delta) < 0.5) return target;
    const direction = Math.sign(delta);
    if (time - this.lastTime > 160 || direction !== this.direction) {
      this.anchor = Math.round(target);
      this.distance = 0;
    }
    this.lastTime = time;
    this.direction = direction;
    this.distance += Math.abs(delta);
    return target + delta / stride;
  }

  snap(target: number) {
    const nearest = Math.round(target);
    // A deliberate short gesture still completes one card, even when its
    // physical distance is below half a card. There is no animation lock.
    return nearest === this.anchor && this.distance >= 8
      ? nearest + this.direction : nearest;
  }
}

export function wrapProject(index: number, count: number) {
  return ((index % count) + count) % count;
}

export type FolderMetrics = { width: number; height: number; cardWidth: number; cardHeight: number };
export type FolderPose = { y: number; scale: number; angle: number; perspective: number };
const DEPTH_STEP = 0.036;
// At most ten overlapping strips intersect the viewport, including its edges.
const CLOSED_SPACING = 0.1145;
const FRONT_SPREAD = [2, 3, 4].reduce((sum, i) => sum + Math.exp(DEPTH_STEP * i), 0);
const openingGap = (height: number) => Math.max(16, height * 0.025);
const mix = (a: number, b: number, progress: number) => a + (b - a) * progress;

/** Projected edge coordinates, relative to the plane's center. */
export function folderEdges(pose: FolderPose, cardHeight: number) {
  const angle = pose.angle * Math.PI / 180;
  const half = cardHeight / 2;
  const edge = (y: number) => pose.y + pose.scale * y * Math.cos(angle) / (1 - y * Math.sin(angle) / pose.perspective);
  return { top: edge(-half), bottom: edge(half) };
}

function stackTravel(distance: number, metrics: FolderMetrics) {
  return (Math.exp(DEPTH_STEP * distance) - 1) / DEPTH_STEP * metrics.height * CLOSED_SPACING;
}

function restingPose(distance: number, metrics: FolderMetrics): FolderPose {
  const scale = Math.exp(DEPTH_STEP * distance);
  const pose = { y: 0, scale, angle: -42, perspective: metrics.width * 1.8 };
  // Center the visible upper strip, not the hidden center of the full video.
  // Most of each card is naturally occluded by the next card in the stack.
  pose.y = stackTravel(distance, metrics) - metrics.height * CLOSED_SPACING / 2 * scale - folderEdges(pose, metrics.cardHeight).top;
  return pose;
}

/** One coherent layout for the closed stack and its centered selection. */
function rawFolderPose(distance: number, metrics: FolderMetrics, opening = 0, selectedDistance = 0): FolderPose {
  const closed = restingPose(distance, metrics);
  if (opening === 0) return closed;
  const relative = Math.round(distance - selectedDistance);
  const center = restingPose(selectedDistance, metrics);
  const selected: FolderPose = { y: stackTravel(selectedDistance, metrics), scale: center.scale * 0.84, angle: 0, perspective: metrics.width * 6 };
  let opened = selected;
  const gap = openingGap(metrics.height);
  if (relative !== 0) {
    const side = Math.sign(relative);
    const selectedEdges = folderEdges(selected, metrics.cardHeight);
    const frontTop = selectedEdges.bottom + gap;
    // The fourth foreground file starts below the viewport. The three nearer
    // files spread progressively, following the same depth scale as the stack.
    const frontStep = (Math.max(0, metrics.height / 2 - frontTop) + metrics.height * 0.012)
      / FRONT_SPREAD;
    let previous = selected;
    for (let offset = 1; offset <= Math.abs(relative); offset++) {
      const scale = side > 0
        ? Math.exp(DEPTH_STEP * offset) * center.scale * 0.96
        : selected.scale * Math.exp(-0.048 * offset);
      const pose: FolderPose = {
        y: 0, scale,
        angle: side > 0 ? -60 - Math.min(offset - 1, 4) * 1.5 : -10 + Math.min(offset - 1, 5),
        perspective: metrics.width * (side > 0 ? 1.1 : 4.5),
      };
      const edges = folderEdges(pose, metrics.cardHeight);
      if (offset === 1) {
        pose.y = side > 0 ? frontTop - edges.top : selectedEdges.top - metrics.height * 0.092 - edges.top;
      } else {
        // Neighbours remain a stack of overlapping strips. Only the selected
        // card gets a full clear opening; every other plane changes with it.
        const previousEdges = folderEdges(previous, metrics.cardHeight);
        const step = side > 0 ? frontStep * Math.exp(DEPTH_STEP * offset) : metrics.height * 0.092 * Math.exp(-0.048 * (offset - 1));
        pose.y = previousEdges.top + side * step - edges.top;
      }
      previous = pose;
    }
    opened = previous;
  }
  return {
    y: mix(closed.y, opened.y, opening),
    scale: mix(closed.scale, opened.scale, opening),
    angle: mix(closed.angle, opened.angle, opening),
    perspective: mix(closed.perspective, opened.perspective, opening),
  };
}

export function folderPose(distance: number, metrics: FolderMetrics, opening = 0, selectedDistance = 0): FolderPose {
  const pose = rawFolderPose(distance, metrics, opening, selectedDistance);
  const relative = Math.round(distance - selectedDistance);
  // Rear files deliberately continue behind the selected plane. Only the
  // foreground needs clearance; its natural z-order would otherwise cover it.
  if (!opening || relative <= 0) return pose;
  const first = rawFolderPose(selectedDistance + 1, metrics, opening, selectedDistance);
  const selected = rawFolderPose(selectedDistance, metrics, opening, selectedDistance);
  const firstEdges = folderEdges(first, metrics.cardHeight);
  const selectedEdges = folderEdges(selected, metrics.cardHeight);
  const closedFirst = folderEdges(restingPose(selectedDistance + 1, metrics), metrics.cardHeight);
  const closedSelected = folderEdges(restingPose(selectedDistance, metrics), metrics.cardHeight);
  const initialGap = closedFirst.top - closedSelected.bottom;
  const gap = mix(initialGap, openingGap(metrics.height), opening);
  const actualGap = firstEdges.top - selectedEdges.bottom;
  // Reserve space from the currently projected edges, not the layout boxes.
  // Occlusion releases gradually as the selected file unfolds; it never
  // paints on top of the nearer files. At full opening its lower edge is clear.
  return { ...pose, y: pose.y + Math.max(0, gap - actualGap) };
}
