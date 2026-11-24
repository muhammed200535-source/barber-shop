// Builds a single-file Cloudflare Worker.
// Usage:  node build.mjs            → dist/default/worker.js (empty template)
//         node build.mjs remagic    → dist/remagic/worker.js (Remagic settings and photos embedded)
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, extname, basename } from "node:path";

const ROOT = new URL(".", import.meta.url).pathname;
const preset = process.argv[2] || "default";
const presetDir = join(ROOT, "presets", preset);
if (!existsSync(presetDir)) { console.error("Preset bulunamadı:", preset); process.exit(1); }

const read = (p) => readFileSync(join(ROOT, p), "utf8");
const stripImports = (s) => s.replace(/^import[\s\S]*?from\s+["'][^"']+["'];?\s*$/gm, "");
const stripExports = (s) => s.replace(/^export\s+(?=(async\s+)?(function|const|let|class))/gm, "");
const TYPES = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

const index = read("src/index.src.html").replace("/*CSS*/", () => read("src/_css.txt"));
const booking = read("src/booking.js");

const assets = {
  "/index.html": { t: "text/html; charset=utf-8", s: index },
  "/admin.html": { t: "text/html; charset=utf-8", s: read("src/admin.html") },
  "/booking.js": { t: "text/javascript; charset=utf-8", s: booking },
};

const mediaDir = join(presetDir, "media");
if (existsSync(mediaDir)) {
  for (const f of readdirSync(mediaDir)) {
    const t = TYPES[extname(f).toLowerCase()];
    if (!t) continue;
    assets["/media/" + basename(f, extname(f))] = { t, b: readFileSync(join(mediaDir, f)).toString("base64") };
  }
}

const settings = JSON.parse(readFileSync(join(presetDir, "settings.json"), "utf8"));
settings.mediaVersion = Date.now();

const out = `// =====================================================================
//  BARBER BOOKING WORKER — preset: ${preset} — ${new Date().toISOString().slice(0, 10)}
//  Generated automatically (node build.mjs ${preset}). Do not edit by hand —
//  use the admin panel (/admin → Настройки) instead.
// =====================================================================

// ---------- booking.js ----------
${stripExports(booking)}

// ---------- embedded settings and files ----------
const PRESET = ${JSON.stringify(settings)};
const ASSETS = ${JSON.stringify(assets)};

// ---------- worker ----------
${stripImports(read("src/worker.js"))}
`;

mkdirSync(join(ROOT, "dist", preset), { recursive: true });
writeFileSync(join(ROOT, "dist", preset, "worker.js"), out);
console.log(`dist/${preset}/worker.js — ${(out.length / 1024).toFixed(0)} KB`);
