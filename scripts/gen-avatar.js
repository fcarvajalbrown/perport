#!/usr/bin/env node
/*
 * gen-avatar.js — download the GitHub avatar once and optimize it to a small
 * local webp (src/avatar.webp), so the portfolio hero paints instantly instead
 * of waiting on a github.com -> avatars CDN redirect at runtime.
 *
 * Run this only when the GitHub avatar actually changes:
 *   node scripts/gen-avatar.js
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const USER = "fcarvajalbrown";
const OUT = path.join(__dirname, "..", "src", "avatar.webp");
const SIZE = 240; // rendered ~120px, 2x for retina

async function main() {
  const res = await fetch("https://github.com/" + USER + ".png", { redirect: "follow" });
  if (!res.ok) throw new Error("avatar fetch failed: HTTP " + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  await sharp(buf)
    .resize(SIZE, SIZE, { fit: "cover" })
    .webp({ quality: 82 })
    .toFile(OUT);
  const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
  console.log("wrote " + OUT + " (" + kb + " KB)");
}

main().catch(function (e) { console.error("gen-avatar:", e.message); process.exit(1); });
