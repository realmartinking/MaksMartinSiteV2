/** Stagger across observer callbacks, including batches appended during intro. */
export class EntranceQueue {
  private next = 0;
  private waitingForIntro: boolean;
  constructor(waitingForIntro: boolean) { this.waitingForIntro = waitingForIntro; }

  releaseIntro(now: number) {
    if (this.waitingForIntro) {
      this.waitingForIntro = false;
      this.next += now;
    }
  }

  delay(now: number) {
    const clock = this.waitingForIntro ? 0 : now;
    const start = Math.max(clock, this.next);
    this.next = start + 80;
    return (start - clock) / 1000;
  }
}
