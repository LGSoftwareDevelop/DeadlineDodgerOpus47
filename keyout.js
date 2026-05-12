// Removes the checkerboard "transparency indicator" that was baked into the
// generated PNGs. The checkerboard is a regular pattern of near-white
// (~255,255,255) and light-grey (~200,200,200) squares. We flood-fill from
// every edge pixel: any pixel that matches one of those two colors (within
// tolerance) AND is reachable from the edge without crossing the subject's
// outline gets its alpha set to 0.

const sharp = require("sharp");
const fs = require("fs");

const TOL = 18; // per-channel color tolerance
const BG_COLORS = [
  [255, 255, 255], // white squares
  [200, 200, 200], // light-grey squares
];

function isBg(r, g, b) {
  // checkerboard colors are near-greys, so require R≈G≈B
  if (Math.abs(r - g) > 6 || Math.abs(g - b) > 6 || Math.abs(r - b) > 6) {
    return false;
  }
  for (const [br, bg, bb] of BG_COLORS) {
    if (
      Math.abs(r - br) <= TOL &&
      Math.abs(g - bg) <= TOL &&
      Math.abs(b - bb) <= TOL
    ) {
      return true;
    }
  }
  return false;
}

async function removeBackground(src, dst) {
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const rgba = Buffer.from(data); // copy so we can mutate alpha
  const visited = new Uint8Array(w * h);

  // BFS flood fill from every edge pixel that matches BG.
  const queue = [];
  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (visited[i]) return;
    const o = i * 4;
    if (!isBg(rgba[o], rgba[o + 1], rgba[o + 2])) return;
    visited[i] = 1;
    queue.push(x, y);
    rgba[o + 3] = 0; // make transparent
  };

  for (let x = 0; x < w; x++) {
    enqueue(x, 0);
    enqueue(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    enqueue(0, y);
    enqueue(w - 1, y);
  }

  while (queue.length) {
    const y = queue.pop();
    const x = queue.pop();
    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  // Anti-aliasing pass: pixels adjacent to the now-transparent region that
  // are "close-ish" to the BG palette get partial alpha so the edges don't
  // look jagged.
  const out = Buffer.from(rgba);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const o = i * 4;
      if (rgba[o + 3] === 0) continue; // already transparent

      const neighbors = [
        rgba[((y - 1) * w + x) * 4 + 3],
        rgba[((y + 1) * w + x) * 4 + 3],
        rgba[(y * w + x - 1) * 4 + 3],
        rgba[(y * w + x + 1) * 4 + 3],
      ];
      const transNeighbors = neighbors.filter((v) => v === 0).length;
      if (transNeighbors === 0) continue;

      const r = rgba[o],
        g = rgba[o + 1],
        b = rgba[o + 2];
      // distance to nearest BG color
      let minDist = Infinity;
      for (const [br, bg, bb] of BG_COLORS) {
        const d = Math.abs(r - br) + Math.abs(g - bg) + Math.abs(b - bb);
        if (d < minDist) minDist = d;
      }
      // soft falloff: very close to BG = mostly transparent
      if (minDist < 60) {
        const factor = minDist / 60; // 0..1
        const reduction = 1 - (1 - factor) * (transNeighbors / 4);
        out[o + 3] = Math.max(0, Math.min(255, Math.round(255 * reduction)));
      }
    }
  }

  await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(dst);

  const stats = fs.statSync(dst);
  const transparentPixels = (() => {
    let c = 0;
    for (let i = 3; i < out.length; i += 4) if (out[i] === 0) c++;
    return c;
  })();
  console.log(
    `${dst}: ${(stats.size / 1024).toFixed(0)}KB, ${transparentPixels} transparent px (${((transparentPixels / (w * h)) * 100).toFixed(1)}%)`,
  );
}

(async () => {
  const files = ["mascot.png", "mascot-celebrating.png", "mascot-tired.png"];
  // Work from the high-res masters if we still have them. Otherwise from
  // the 512s already in /public.
  for (const f of files) {
    const src = "public/" + f;
    const tmpDst = "public/_" + f;
    await removeBackground(src, tmpDst);
    fs.renameSync(tmpDst, src);
  }
})();
