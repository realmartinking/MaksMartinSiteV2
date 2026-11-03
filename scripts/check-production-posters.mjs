// Run with FFMPEG=/path/to/ffmpeg node --experimental-strip-types scripts/check-production-posters.mjs
// Compare the actual poster/movie pairs selected by the site; a matching file name alone
// cannot detect a poster taken from a later shot, or a different version of the edit.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { PRODUCTION_PROJECTS } from '../src/lib/projects.ts';

function frame(path, seconds = 0) {
  const file = fileURLToPath(new URL('../public' + path, import.meta.url));
  return execFileSync(process.env.FFMPEG || 'ffmpeg', [
    '-loglevel', 'error', '-nostdin', '-ss', String(seconds), '-i', file,
    '-frames:v', '1', '-vf', 'scale=320:180:flags=area', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-',
  ]);
}

for (const project of PRODUCTION_PROJECTS) {
  for (const [movie, poster] of [[project.videoSrc, project.posterSrc],
    [project.mobilePreviewBase + '.mp4', project.mobilePreviewBase + '.webp']]) {
    const picture = frame(poster), start = frame(movie, project.posterUntil);
    assert.equal(picture.length, 320 * 180 * 3, poster);
    assert.equal(start.length, picture.length, movie);
    const error = picture.reduce((sum, ch, i) => sum + Math.abs(ch - start[i]), 0) / picture.length;
    // Allow lossy WebP and colorspace rounding. The prior OLV poster (0.4–0.5s
    // into the shot) missed its opening frame by ~15 levels out of 255.
    assert.ok(error < 4, `${poster} does not match the first displayed frame of ${movie} (mean error ${error.toFixed(2)}/255)`);
  }
}
console.log('All 16 Production posters match their opening video frames.');
