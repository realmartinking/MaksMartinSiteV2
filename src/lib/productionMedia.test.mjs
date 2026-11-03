import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { PRODUCTION_PROJECTS } from './projects.ts';

const asset = path => new URL('../../public' + path, import.meta.url);

test('every Production project ships a smaller fast-start phone movie and a real poster', () => {
  for (const project of PRODUCTION_PROJECTS) {
    const { name, mobilePreviewBase, videoSrc } = project;
    assert.ok(mobilePreviewBase, name);
    const mp4 = readFileSync(asset(mobilePreviewBase + '.mp4'));
    assert.ok(mp4.length < statSync(asset(videoSrc)).size, name);
    const boxes = [];
    for (let offset = 0; offset < mp4.length;) {
      const length = mp4.readUInt32BE(offset);
      assert.ok(length >= 8 && offset + length <= mp4.length, name);
      boxes.push(mp4.toString('ascii', offset + 4, offset + 8));
      offset += length;
    }
    assert.equal(boxes[0], 'ftyp', name);
    assert.ok(boxes.indexOf('moov') >= 0 && boxes.indexOf('moov') < boxes.indexOf('mdat'), name);
    const poster = readFileSync(asset(mobilePreviewBase + '.webp'));
    assert.equal(poster.toString('ascii', 0, 4), 'RIFF', name);
    assert.equal(poster.toString('ascii', 8, 12), 'WEBP', name);
  }
});
