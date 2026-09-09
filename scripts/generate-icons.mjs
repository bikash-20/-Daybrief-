import sharp from "sharp";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("public/icons");
await mkdir(OUT, { recursive: true });

// Soft gradient reminiscent of the morning brief weather card.
const svg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6CB7FF"/>
      <stop offset="55%" stop-color="#4F8DF3"/>
      <stop offset="100%" stop-color="#2E5BCC"/>
    </linearGradient>
    <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFE38A"/>
      <stop offset="100%" stop-color="#FFB347"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" ry="112" fill="url(#g)"/>
  <circle cx="340" cy="180" r="78" fill="url(#sun)"/>
  <g fill="#FFFFFF">
    <path d="M132 340 q40 -64 110 -64 q70 0 110 64 q-40 64 -110 64 q-70 0 -110 -64 z" opacity="0.92"/>
    <circle cx="180" cy="332" r="22"/>
    <circle cx="252" cy="324" r="22"/>
    <circle cx="324" cy="332" r="22"/>
  </g>
</svg>`;

const targets = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "icon-maskable-512.png", size: 512, maskable: true },
  { name: "apple-touch-icon.png", size: 180 },
];

for (const t of targets) {
  const buf = Buffer.from(svg(t.size));
  let pipeline = sharp(buf);
  if (t.maskable) {
    // Add 10% safe-zone padding so the icon survives Android maskable cropping.
    const inner = await sharp(buf).resize(Math.round(t.size * 0.8)).toBuffer();
    pipeline = sharp({
      create: {
        width: t.size,
        height: t.size,
        channels: 4,
        background: { r: 47, g: 91, b: 204, alpha: 1 },
      },
    }).composite([{ input: inner, gravity: "center" }]);
  }
  const out = path.join(OUT, t.name);
  await pipeline.png().toFile(out);
  console.log("wrote", out);
}

// Favicon SVG (browsers ignore PNG favicons when SVG is present).
await writeFile(
  path.resolve("public/favicon.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#6CB7FF"/><stop offset="100%" stop-color="#2E5BCC"/></linearGradient></defs><rect width="64" height="64" rx="14" fill="url(#g)"/><circle cx="42" cy="22" r="10" fill="#FFD27A"/><path d="M14 42 q8 -10 18 -10 q10 0 18 10 q-8 10 -18 10 q-10 0 -18 -10 z" fill="#fff" opacity="0.95"/></svg>`,
);
console.log("wrote favicon.svg");
