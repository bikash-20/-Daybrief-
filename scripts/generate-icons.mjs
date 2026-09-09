import sharp from "sharp";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

// Brand SVG. Single source of truth — every PNG below is rasterized from this.
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7CC4FF"/>
      <stop offset="55%" stop-color="#4F8DF3"/>
      <stop offset="100%" stop-color="#274FC2"/>
    </linearGradient>
    <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFE9A8"/>
      <stop offset="100%" stop-color="#FFB057"/>
    </linearGradient>
    <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.96"/>
      <stop offset="100%" stop-color="#E9EFFA" stop-opacity="0.92"/>
    </linearGradient>
    <linearGradient id="line" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#3B7BE0"/>
      <stop offset="100%" stop-color="#7AA9F5"/>
    </linearGradient>
    <filter id="soft" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="4"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="112" ry="112" fill="url(#bg)"/>
  <rect x="0" y="0" width="512" height="200" rx="112" ry="112" fill="#FFFFFF" opacity="0.06"/>
  <g transform="translate(0,-6)">
    <circle cx="362" cy="196" r="100" fill="#FFD27A" opacity="0.18" filter="url(#soft)"/>
    <circle cx="362" cy="196" r="72" fill="url(#sun)"/>
  </g>
  <g transform="translate(96,150)">
    <rect x="6" y="14" width="320" height="240" rx="36" ry="36" fill="#0B1430" opacity="0.18" filter="url(#soft)"/>
    <rect x="0" y="0" width="320" height="240" rx="36" ry="36" fill="url(#card)"/>
    <rect x="28" y="28" width="72" height="44" rx="12" ry="12" fill="url(#line)" opacity="0.16"/>
    <rect x="28" y="28" width="72" height="6" rx="3" ry="3" fill="url(#line)" opacity="0.55"/>
    <rect x="36" y="42" width="40" height="6" rx="3" ry="3" fill="#274FC2" opacity="0.75"/>
    <rect x="36" y="54" width="28" height="14" rx="3" ry="3" fill="#274FC2" opacity="0.55"/>
    <rect x="116" y="32" width="170" height="14" rx="7" ry="7" fill="#274FC2" opacity="0.85"/>
    <rect x="116" y="54" width="120" height="10" rx="5" ry="5" fill="#274FC2" opacity="0.35"/>
    <rect x="28" y="92" width="264" height="2" rx="1" ry="1" fill="#274FC2" opacity="0.10"/>
    <circle cx="44" cy="124" r="10" fill="#4F8DF3" opacity="0.85"/>
    <rect x="64" y="118" width="170" height="10" rx="5" ry="5" fill="#274FC2" opacity="0.55"/>
    <rect x="64" y="132" width="120" height="8"  rx="4" ry="4" fill="#274FC2" opacity="0.25"/>
    <circle cx="44" cy="160" r="10" fill="#FFB057" opacity="0.95"/>
    <rect x="64" y="154" width="200" height="10" rx="5" ry="5" fill="#274FC2" opacity="0.55"/>
    <rect x="64" y="168" width="150" height="8"  rx="4" ry="4" fill="#274FC2" opacity="0.25"/>
    <circle cx="44" cy="196" r="10" fill="#7AA9F5" opacity="0.95"/>
    <rect x="64" y="190" width="160" height="10" rx="5" ry="5" fill="#274FC2" opacity="0.55"/>
    <rect x="64" y="204" width="110" height="8"  rx="4" ry="4" fill="#274FC2" opacity="0.25"/>
    <g transform="translate(28,220)">
      <rect x="0"  y="0" width="40" height="6" rx="3" ry="3" fill="#274FC2" opacity="0.30"/>
      <rect x="48" y="0" width="22" height="6" rx="3" ry="3" fill="#274FC2" opacity="0.18"/>
      <rect x="78" y="0" width="14" height="6" rx="3" ry="3" fill="#274FC2" opacity="0.12"/>
    </g>
  </g>
</svg>`;

const OUT = path.resolve("public/icons");
await mkdir(OUT, { recursive: true });

// All raster sizes, grouped by platform.
const targets = [
  // PWA standard (manifest.json)
  { name: "icon-192.png", size: 192, purpose: "pwa" },
  { name: "icon-512.png", size: 512, purpose: "pwa" },
  { name: "icon-maskable-512.png", size: 512, purpose: "maskable" },

  // Apple touch / home screen
  { name: "apple-touch-icon.png", size: 180, purpose: "ios" },
  { name: "apple-touch-icon-ipad.png", size: 167, purpose: "ios" },
  { name: "apple-touch-icon-ipad-pro.png", size: 152, purpose: "ios" },
  { name: "apple-touch-icon-marketing-1024.png", size: 1024, purpose: "ios-marketing" },

  // Android / Chrome (legacy + adaptive) — same bitmap, alias to standard names.
  { name: "icon-48.png", size: 48, purpose: "android" },
  { name: "icon-72.png", size: 72, purpose: "android" },
  { name: "icon-96.png", size: 96, purpose: "android" },
  { name: "icon-144.png", size: 144, purpose: "android" },
  { name: "icon-256.png", size: 256, purpose: "android" },

  // Windows / desktop / browser favicons
  { name: "favicon-16.png", size: 16, purpose: "favicon" },
  { name: "favicon-32.png", size: 32, purpose: "favicon" },
  { name: "favicon-48.png", size: 48, purpose: "favicon" },
  { name: "favicon-64.png", size: 64, purpose: "favicon" },
  { name: "favicon-256.png", size: 256, purpose: "favicon" },
];

const basePng = sharp(Buffer.from(LOGO_SVG));

for (const t of targets) {
  let pipeline = basePng.clone().resize(t.size, t.size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } });
  if (t.purpose === "maskable") {
    // Pad to 80% safe zone (Android applies an 18% circle mask on adaptive icons).
    const inner = await basePng.clone().resize(Math.round(t.size * 0.8)).png().toBuffer();
    pipeline = sharp({
      create: { width: t.size, height: t.size, channels: 4, background: { r: 39, g: 79, b: 194, alpha: 1 } },
    }).composite([{ input: inner, gravity: "center" }]);
  }
  const out = path.join(OUT, t.name);
  await pipeline.png().toFile(out);
  console.log("wrote", out, `(${t.size}px, ${t.purpose})`);
}

// Multi-resolution favicon.ico (legacy browsers / desktop shortcuts).
const icoSizes = [16, 32, 48];
const icoFrames = await Promise.all(
  icoSizes.map(async (s) => ({
    size: s,
    buf: await basePng.clone().resize(s, s).png().toBuffer(),
  })),
);
await sharp(icoFrames[icoFrames.length - 1].buf)
  .toFile(path.resolve("app/favicon.ico"), { ico: { sizes: icoFrames.map((f) => ({ size: f.size, input: f.buf })) } });
console.log("wrote app/favicon.ico (16, 32, 48 multi-res)");
