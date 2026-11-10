/* Small animated-GIF writer: one global 256-colour palette (median cut), ordered dithering, LZW. */
(function () {
  function medianCut(samples, n) {
    // samples: Uint8Array rgbrgb...
    let boxes = [{ idx: Array.from({ length: samples.length / 3 }, (_, i) => i) }];
    const range = (b) => {
      let mn = [255, 255, 255], mx = [0, 0, 0];
      for (const i of b.idx) for (let c = 0; c < 3; c++) { const v = samples[i * 3 + c]; if (v < mn[c]) mn[c] = v; if (v > mx[c]) mx[c] = v; }
      const d = [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]]; const ch = d[0] >= d[1] && d[0] >= d[2] ? 0 : d[1] >= d[2] ? 1 : 2;
      b.ch = ch; b.score = d[ch] * Math.sqrt(b.idx.length); return b;
    };
    boxes = boxes.map(range);
    while (boxes.length < n) {
      boxes.sort((a, b) => b.score - a.score);
      const b = boxes.shift(); if (!b || b.idx.length < 2 || b.score === 0) { if (b) boxes.push(b); break; }
      b.idx.sort((x, y) => samples[x * 3 + b.ch] - samples[y * 3 + b.ch]);
      const mid = b.idx.length >> 1;
      boxes.push(range({ idx: b.idx.slice(0, mid) }), range({ idx: b.idx.slice(mid) }));
    }
    const pal = new Uint8Array(n * 3);
    boxes.forEach((b, k) => { let r = 0, g = 0, bl = 0; for (const i of b.idx) { r += samples[i * 3]; g += samples[i * 3 + 1]; bl += samples[i * 3 + 2]; } const c = b.idx.length || 1; pal[k * 3] = r / c; pal[k * 3 + 1] = g / c; pal[k * 3 + 2] = bl / c; });
    return pal;
  }
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);

  function GifWriter(w, h, opts) {
    this.w = w; this.h = h; this.dither = (opts && opts.dither) ?? 7; this.out = []; this.cache = new Int16Array(32768).fill(-1);
  }
  GifWriter.prototype.setPalette = function (samples) {
    this.pal = medianCut(samples, 256);
    const o = this.out, w = this.w, h = this.h;
    o.push(...[71, 73, 70, 56, 57, 97], w & 255, w >> 8, h & 255, h >> 8, 0xf7, 0, 0);
    for (let i = 0; i < 768; i++) o.push(this.pal[i]);
    o.push(0x21, 0xff, 0x0b, ...[78, 69, 84, 83, 67, 65, 80, 69, 50, 46, 48], 3, 1, 0, 0, 0); // loop forever
  };
  GifWriter.prototype.nearest = function (r, g, b) {
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    let c = this.cache[key]; if (c >= 0) return c;
    const p = this.pal; let best = 0, bd = 1e9;
    for (let i = 0; i < 256; i++) { const dr = p[i * 3] - r, dg = p[i * 3 + 1] - g, db = p[i * 3 + 2] - b, d = dr * dr * 2 + dg * dg * 4 + db * db * 3; if (d < bd) { bd = d; best = i; } }
    this.cache[key] = best; return best;
  };
  GifWriter.prototype.addFrame = function (rgba, delayCs) {
    const w = this.w, h = this.h, n = w * h, idx = new Uint8Array(n), D = this.dither;
    for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i++) {
      const t = D ? BAYER[(y & 3) * 4 + (x & 3)] * D * 2 : 0, j = i * 4;
      const r = Math.max(0, Math.min(255, rgba[j] + t)), g = Math.max(0, Math.min(255, rgba[j + 1] + t)), b = Math.max(0, Math.min(255, rgba[j + 2] + t));
      idx[i] = this.nearest(r | 0, g | 0, b | 0);
    }
    const o = this.out;
    o.push(0x21, 0xf9, 4, 0, delayCs & 255, delayCs >> 8, 0, 0);
    o.push(0x2c, 0, 0, 0, 0, w & 255, w >> 8, h & 255, h >> 8, 0);
    lzw(idx, 8, o);
  };
  GifWriter.prototype.finish = function () { this.out.push(0x3b); return new Uint8Array(this.out); };

  function lzw(idx, minCode, o) {
    o.push(minCode);
    const clear = 1 << minCode, eoi = clear + 1;
    let size = minCode + 1, next = eoi + 1, dict = new Map();
    let buf = 0, bits = 0, block = [];
    const emit = (code) => { buf |= code << bits; bits += size; while (bits >= 8) { block.push(buf & 255); buf >>= 8; bits -= 8; if (block.length === 255) { o.push(255, ...block); block = []; } } };
    emit(clear);
    let prefix = idx[0];
    for (let i = 1; i < idx.length; i++) {
      const k = idx[i], key = prefix * 256 + k, hit = dict.get(key);
      if (hit !== undefined) { prefix = hit; continue; }
      emit(prefix);
      if (next < 4096) { dict.set(key, next++); if (next > (1 << size) && size < 12) size++; }
      else { emit(clear); dict = new Map(); size = minCode + 1; next = eoi + 1; }
      prefix = k;
    }
    emit(prefix); emit(eoi);
    if (bits > 0) { block.push(buf & 255); }
    if (block.length) o.push(block.length, ...block);
    o.push(0);
  }
  window.TRGif = { GifWriter };
})();
