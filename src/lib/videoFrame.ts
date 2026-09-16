/** Keep the independent poster visible until a real frame reaches the compositor.
 * A resolved play() or loadedmetadata event alone is not a painted frame.
 */
export function observeVideoFrame(video: HTMLVideoElement, ready: (value: boolean) => void) {
  let callback = 0, frame = 0, disposed = false, painted = false;
  const cancel = () => {
    if (callback) video.cancelVideoFrameCallback(callback);
    callback = 0;
    cancelAnimationFrame(frame); frame = 0;
  };
  const show = () => {
    callback = 0; frame = 0;
    if (!disposed && !video.paused && video.readyState >= 2) { painted = true; ready(true); }
  };
  const arm = () => {
    if (disposed || painted || callback || frame) return;
    if (typeof video.requestVideoFrameCallback === 'function') callback = video.requestVideoFrameCallback(show);
    // Older WebKit: wait for playback and two paint opportunities, not metadata.
    else if (!video.paused && video.readyState >= 2) frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(show);
    });
  };
  const reset = () => { cancel(); painted = false; ready(false); };
  video.addEventListener('playing', arm);
  video.addEventListener('loadeddata', arm);
  video.addEventListener('emptied', reset);
  video.addEventListener('error', reset);
  ready(false); arm();
  return () => {
    disposed = true; cancel();
    video.removeEventListener('playing', arm);
    video.removeEventListener('loadeddata', arm);
    video.removeEventListener('emptied', reset);
    video.removeEventListener('error', reset);
  };
}
