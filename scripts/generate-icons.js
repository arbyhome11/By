import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Function to generate PNG buffer using built-in Node.js zlib
function createPng(width, height, drawFn) {
  // 1 byte per scanline filter (0 = None) + width * 4 bytes (RGBA)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 implementation
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    crc32.table = table;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Heart shape mathematical SDF
// Terracotta background: #C85A32 (200, 90, 50)
// Rose heart: #F43F5E (244, 63, 94) to #FB7185 (251, 113, 133)
// Soft cream accent / border: #FAF7F2
function drawHeart(x, y, w, h, isMaskable = false) {
  // Normalize coords from -1 to 1
  const nx = (x / w) * 2 - 1;
  // Flip y so up is positive
  const ny = -((y / h) * 2 - 1);

  // Background terracotta color:
  const bgR = 200, bgG = 90, bgB = 50; // #C85A32

  // Scale heart: for maskable icons, scale down to 60% for safe area (Android safe zone)
  const scale = isMaskable ? 0.55 : 0.72;
  const hx = nx / scale;
  const hy = (ny + 0.15) / scale; // slight vertical offset

  // Heart formula: (x^2 + y^2 - 1)^3 - x^2 * y^3 <= 0
  const f = Math.pow(hx * hx + hy * hy - 1, 3) - (hx * hx) * (hy * hy * hy);

  if (f <= 0) {
    // Inside heart: beautiful rose gradient with slight highlight
    const grad = Math.min(1, Math.max(0, (hy + 1) / 2));
    const r = Math.round(251 * grad + 244 * (1 - grad));
    const g = Math.round(113 * grad + 63 * (1 - grad));
    const b = Math.round(133 * grad + 94 * (1 - grad));
    return [r, g, b, 255];
  } else if (f < 0.08) {
    // Soft anti-aliased / warm cream border
    const t = f / 0.08;
    const r = Math.round(250 * (1 - t) + bgR * t);
    const g = Math.round(247 * (1 - t) + bgG * t);
    const b = Math.round(242 * (1 - t) + bgB * t);
    return [r, g, b, 255];
  } else {
    // Terracotta background
    return [bgR, bgG, bgB, 255];
  }
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. 192x192
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, (x, y, w, h) => drawHeart(x, y, w, h, false)));
// 2. 512x512
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, (x, y, w, h) => drawHeart(x, y, w, h, false)));
// 3. maskable 512x512
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, (x, y, w, h) => drawHeart(x, y, w, h, true)));
// 4. Apple touch icon 180x180
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, (x, y, w, h) => drawHeart(x, y, w, h, false)));

// 5. SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="128" fill="#C85A32" />
  <path d="M256 440s-150-96-200-186c-42-76-10-164 74-178 52-8 102 24 126 68 24-44 74-76 126-68 84 14 116 102 74 178-50 90-200 186-200 186z" fill="#FB7185" stroke="#FAF7F2" stroke-width="12" stroke-linejoin="round" />
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);

console.log('Successfully generated all PWA icons!');
