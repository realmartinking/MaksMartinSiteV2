/** A gesture includes the trackpad's momentum tail, not just its first event. */
export class FolderGesture {
  private lastTime = -Infinity;
  private direction = 0;
  private distance = 0;
  private steps = 0;

  reset() { this.lastTime = -Infinity; this.direction = 0; this.distance = 0; this.steps = 0; }

  push(delta: number, time: number) {
    if (Math.abs(delta) < 0.5) return 0;
    const direction = Math.sign(delta);
    if (time - this.lastTime <= 180 && direction !== this.direction && Math.abs(delta) < 8) return 0;
    if (time - this.lastTime > 180 || direction !== this.direction) {
      this.distance = 0;
      this.steps = 0;
    }
    this.direction = direction;
    this.lastTime = time;
    this.distance += Math.abs(delta);
    const budget = this.distance >= 420 ? 2 : this.distance >= 24 ? 1 : 0;
    const change = budget - this.steps;
    this.steps = budget;
    return change * direction;
  }
}

export function wrapProject(index: number, count: number) {
  return ((index % count) + count) % count;
}

// One receding file stack: far cards are above and smaller; near cards below
// are larger. Every resting card shares the same tilt, as in the video.
export function folderPose(distance: number, viewportHeight: number) {
  return {
    y: distance * Math.max(44, Math.min(90, viewportHeight * 0.085)),
    z: distance * 58,
    rotateX: -68,
  };
}
