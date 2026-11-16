// Run: node brand/poster-maker/check-gif-timing.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'src/gif.js'), 'utf8'), context);
const { GifWriter, frameTiming } = context.window.TRGif;
for (const fps of [10, 12, 15, 30, 45, 60]) {
  for (const seconds of [4, 6, 8, 10]) {
    const frames = frameTiming(seconds, fps);
    assert.equal(frames.length, seconds * fps);
    assert.equal(frames.reduce((sum, frame) => sum + frame.delay, 0), seconds * 100);
    frames.forEach((frame, i) => {
      assert.ok(frame.delay >= 1 && Number.isInteger(frame.delay));
      assert.ok(Math.abs(frame.time - i / fps) < 1e-9);
    });
  }
  // Encode real frames and inspect their GIF graphic-control delay fields.
  const writer = new GifWriter(1, 1, { dither: 0 });
  writer.setPalette(new Uint8Array([255, 0, 0, 0, 0, 255]));
  const frames = frameTiming(4, fps);
  frames.forEach((frame, i) => writer.addFrame(new Uint8Array(i % 2 ? [255, 0, 0, 255] : [0, 0, 255, 255]), frame.delay));
  const bytes = Buffer.from(writer.finish());
  const delays = [];
  for (let i = 0; i < bytes.length - 7; i++) {
    if (bytes[i] === 0x21 && bytes[i + 1] === 0xf9 && bytes[i + 2] === 4) delays.push(bytes.readUInt16LE(i + 4));
  }
  assert.deepEqual(delays, Array.from(frames, frame => frame.delay));
  assert.equal(bytes.subarray(0, 6).toString(), 'GIF89a');
  assert.equal(bytes.at(-1), 0x3b);
}
console.log('PASS: all six FPS choices, four loop lengths, and encoded GIF frame delays.');
