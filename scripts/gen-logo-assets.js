// One-off asset generator: produces the small nav logo and favicon variants
// from the full-resolution src/logo.png (906x1000, ~140 KB). Re-run after
// changing the source logo:  node scripts/gen-logo-assets.js
//
// Outputs (into src/, all passthrough-copied by .eleventy.js):
//   logo-nav.png / logo-nav.webp  29x32 CSS px logo at 2x (58x64), transparent
//   favicon-32.png                32x32 square, brand-dark background
//   apple-touch-icon.png          180x180 square, brand-dark background
const sharp = require("sharp");
const path = require("path");

const SRC = path.join(__dirname, "..", "src", "logo.png");
const OUT = path.join(__dirname, "..", "src");
const BG = { r: 0x0b, g: 0x0f, b: 0x19, alpha: 1 }; // --bg #0b0f19

async function main() {
  // Nav logo at 2x the 29x32 render box; keep transparency.
  await sharp(SRC)
    .resize({ height: 64, fit: "inside" })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, "logo-nav.png"));
  await sharp(SRC)
    .resize({ height: 64, fit: "inside" })
    .webp({ quality: 90 })
    .toFile(path.join(OUT, "logo-nav.webp"));

  // Favicon: square, TRANSPARENT padding so it adapts to the browser tab
  // background exactly like the original logo.png did (the dark spade would
  // vanish on a dark background if flattened).
  await sharp(SRC)
    .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, "favicon-32.png"));

  // Apple touch icon: iOS masks corners and fills transparency with black, so
  // it must be opaque. Sit the mark on the brand-dark background.
  const pad = Math.round(180 * 0.12);
  await sharp(SRC)
    .resize({ height: 180 - pad * 2, fit: "inside" })
    .flatten({ background: BG })
    .resize(180, 180, { fit: "contain", background: BG })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, "apple-touch-icon.png"));
  console.log("Logo assets written to src/.");
}

main().catch((e) => { console.error(e); process.exit(1); });
