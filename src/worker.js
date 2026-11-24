// =====================================================================
//  BARBER BOOKING — Cloudflare Worker
//  Requires: D1 binding "DB"; secrets ADMIN_PASSWORD,
//  TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (optional: SITE_URL)
//  PRESET and ASSETS are added by build.mjs
// =====================================================================
import {
  addDays, availableStarts, formatDateBG, nowInZone, overlapCount, dayHours, phoneDisplay,
  toMin, weekday, WEEKDAYS,
} from "./booking.js";

const MEDIA_NAMES = ["logo", "g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8"];
const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ICONS = ["scissors", "beard", "crown", "curl", "coffee", "clock", "star", "razor", "card", "child"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

class HttpError extends Error {
  constructor(status, message, code) { super(message); this.status = status; this.code = code; }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clean = (v, max) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);

// ---------------------------------------------------------------------
//  Database (D1)
// ---------------------------------------------------------------------
let schemaReady = false;
async function getDB(env) {
  if (!env.DB) throw new HttpError(500, "Базата данни не е свързана (D1 binding „DB“).");
  if (!schemaReady) {
    await env.DB.batch([
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY, date TEXT NOT NULL, time TEXT NOT NULL, start_min INTEGER NOT NULL,
        duration INTEGER NOT NULL, service TEXT, name TEXT, phone TEXT, note TEXT,
        source TEXT, created TEXT)`),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS settings (k TEXT PRIMARY KEY, v TEXT)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS media (name TEXT PRIMARY KEY, type TEXT, data TEXT, updated INTEGER)"),
    ]);
    schemaReady = true;
  }
  return env.DB;
}

async function dayBookings(db, date) {
  const r = await db.prepare("SELECT * FROM bookings WHERE date = ? ORDER BY start_min").bind(date).all();
  return r.results || [];
}

// atomic insert: only saves the booking if there is still a free chair
async function insertBooking(db, cfg, b) {
  const start = toMin(b.time);
  const r = await db.prepare(`
    INSERT INTO bookings (id, date, time, start_min, duration, service, name, phone, note, source, created)
    SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11
    WHERE (SELECT COUNT(*) FROM bookings WHERE date = ?2 AND start_min < ?4 + ?5 AND start_min + duration > ?4) < ?12
  `).bind(b.id, b.date, b.time, start, b.duration, b.service, b.name, b.phone, b.note, b.source, b.created, cfg.chairs).run();
  return (r.meta && r.meta.changes) > 0;
}

// ---------------------------------------------------------------------
//  Settings
// ---------------------------------------------------------------------
async function getSettings(env) {
  let saved = {};
  try {
    const db = await getDB(env);
    const row = await db.prepare("SELECT v FROM settings WHERE k = 'site'").first();
    if (row && row.v) saved = JSON.parse(row.v);
  } catch { /* no database → show the template */ }
  return { ...PRESET, ...saved };
}

async function saveSettings(env, cfg) {
  const db = await getDB(env);
  await db.prepare("INSERT INTO settings (k, v) VALUES ('site', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v")
    .bind(JSON.stringify(cfg)).run();
}

const str = (v, max, def = "") => (v == null ? def : clean(v, max));
const url = (v) => {
  const s = clean(v, 400);
  return /^https:\/\/[^\s"<>]+$/i.test(s) ? s : "";
};
function luminance(hex) {
  const n = parseInt(String(hex).slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
const color = (v, def) => (/^#[0-9a-f]{6}$/i.test(String(v)) ? String(v).toLowerCase() : def);
const int = (v, min, max, def) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : def;
};
const num = (v) => {
  if (v === null || v === "" || v === undefined) return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) && n >= 0 && n < 100000 ? Math.round(n * 100) / 100 : null;
};

function sanitizeSettings(input, base) {
  const i = input || {};
  const out = { ...base };
  for (const [k, max] of Object.entries({
    name: 80, shortName: 30, subName: 40, city: 60, tagline: 120, heroTitle1: 30, heroTitle2: 30,
    heroText: 300, phone: 20, address: 160, seoTitle: 120, seoDescription: 300, eyebrow: 60,
  })) if (k in i) out[k] = str(i[k], max);
  for (const k of ["instagram", "facebook", "tiktok", "mapsUrl"]) if (k in i) out[k] = url(i[k]);
  if ("lat" in i) out.lat = Number.isFinite(Number(i.lat)) && i.lat !== "" && i.lat !== null ? Number(i.lat) : null;
  if ("lng" in i) out.lng = Number.isFinite(Number(i.lng)) && i.lng !== "" && i.lng !== null ? Number(i.lng) : null;
  if ("accent" in i) out.accent = color(i.accent, base.accent);
  if ("bg" in i) {
    const bg = color(i.bg, base.bg);
    out.bg = luminance(bg) < 0.06 ? bg : base.bg; // the background must be dark (the text is light)
  }
  if ("chairs" in i) out.chairs = int(i.chairs, 1, 20, base.chairs);
  if ("slotStep" in i) out.slotStep = [10, 15, 20, 30, 45, 60].includes(Number(i.slotStep)) ? Number(i.slotStep) : base.slotStep;
  if ("minLeadMinutes" in i) out.minLeadMinutes = int(i.minLeadMinutes, 0, 1440, base.minLeadMinutes);
  if ("maxDaysAhead" in i) out.maxDaysAhead = int(i.maxDaysAhead, 1, 90, base.maxDaysAhead);
  if (Array.isArray(i.closedDates)) out.closedDates = i.closedDates.filter((d) => DATE_RE.test(d)).slice(0, 100);
  if (Array.isArray(i.marquee)) out.marquee = i.marquee.map((x) => clean(x, 30)).filter(Boolean).slice(0, 12);
  if (Array.isArray(i.badges)) out.badges = i.badges.slice(0, 2).map((b) => ({ title: str(b && b.title, 30), text: str(b && b.text, 40) }));
  if (i.hours && typeof i.hours === "object") {
    out.hours = {};
    for (let d = 0; d < 7; d++) {
      const h = i.hours[d];
      out.hours[d] = Array.isArray(h) && TIME_RE.test(h[0]) && TIME_RE.test(h[1]) && toMin(h[0]) < toMin(h[1]) ? [h[0], h[1]] : null;
    }
  }
  if (Array.isArray(i.services)) {
    const seen = new Set();
    out.services = i.services.slice(0, 30).map((s) => {
      let id = clean(s && s.id, 40).replace(/[^a-z0-9_-]/gi, "") || "s" + Math.random().toString(36).slice(2, 8);
      while (seen.has(id)) id += "x";
      seen.add(id);
      return {
        id,
        name: str(s.name, 60) || "Услуга",
        desc: str(s.desc, 200),
        price: num(s.price),
        duration: int(s.duration, 10, 600, 30),
        icon: ICONS.includes(s.icon) ? s.icon : "scissors",
        featured: !!s.featured,
      };
    });
    if (!out.services.length) out.services = base.services;
  }
  if (i.offer && typeof i.offer === "object") {
    const o = i.offer;
    out.offer = {
      enabled: !!o.enabled,
      eyebrow: str(o.eyebrow, 40),
      title: str(o.title, 80),
      price: num(o.price),
      priceNote: str(o.priceNote, 40),
      items: Array.isArray(o.items) ? o.items.map((x) => clean(x, 60)).filter(Boolean).slice(0, 10) : [],
      serviceId: clean(o.serviceId, 40),
    };
  }
  if (Array.isArray(i.highlights)) {
    out.highlights = i.highlights.slice(0, 4).map((h) => ({
      icon: ICONS.includes(h && h.icon) ? h.icon : "star", title: str(h && h.title, 50), text: str(h && h.text, 120),
    })).filter((h) => h.title);
  }
  if (Array.isArray(i.faq)) {
    out.faq = i.faq.slice(0, 12).map((f) => ({ q: str(f && f.q, 150), a: str(f && f.a, 600) })).filter((f) => f.q && f.a);
  }
  return out;
}

// ---------------------------------------------------------------------
//  Media (logo and gallery)
// ---------------------------------------------------------------------
async function serveMedia(env, name, request) {
  const cache = typeof caches !== "undefined" ? caches.default : null;
  if (cache) {
    const hit = await cache.match(request);
    if (hit) return hit;
  }
  let res = null;
  try {
    const db = await getDB(env);
    const row = await db.prepare("SELECT type, data FROM media WHERE name = ?").bind(name).first();
    if (row) res = new Response(Uint8Array.from(atob(row.data), (c) => c.charCodeAt(0)), { headers: { "content-type": row.type } });
  } catch { /* no database */ }
  if (!res) {
    const a = ASSETS["/media/" + name];
    if (!a) return new Response("Not found", { status: 404 });
    res = new Response(Uint8Array.from(atob(a.b), (c) => c.charCodeAt(0)), { headers: { "content-type": a.t } });
  }
  res.headers.set("cache-control", "public, max-age=31536000, immutable");
  if (cache) await cache.put(request, res.clone());
  return res;
}

// ---------------------------------------------------------------------
//  Telegram
// ---------------------------------------------------------------------
async function sendTelegram(env, text) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return false;
  const ids = String(env.TELEGRAM_CHAT_ID).split(",").map((s) => s.trim()).filter(Boolean);
  const results = await Promise.all(ids.map((chat_id) =>
    fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id, text, disable_web_page_preview: true }),
    }).then((r) => r.ok).catch(() => false)));
  return results.some(Boolean);
}

const svcOf = (cfg, id) => (cfg.services || []).find((s) => s.id === id);

function bookingMessage(cfg, b, svc, origin) {
  const lines = [
    "💈 НОВА РЕЗЕРВАЦИЯ",
    `🏪 ${cfg.name}`,
    "",
    `📅 ${formatDateBG(b.date)}`,
    `🕐 ${b.time} (${b.duration} мин)`,
    `✂️ ${svc ? svc.name : b.service}${svc && svc.price != null ? ` — ${svc.price} €` : ""}`,
    "",
    `👤 ${b.name}`,
    `📞 ${b.phone}`,
  ];
  if (b.note) lines.push(`📝 ${b.note}`);
  if (origin) lines.push("", `Всички резервации: ${origin}/admin`);
  return lines.join("\n");
}

// ---------------------------------------------------------------------
//  Public API
// ---------------------------------------------------------------------
async function apiSlots(request, env) {
  const date = new URL(request.url).searchParams.get("date") || "";
  if (!DATE_RE.test(date)) throw new HttpError(400, "Невалидна дата.");
  const db = await getDB(env);
  const list = await dayBookings(db, date);
  return json({ date, busy: list.map((b) => ({ time: b.time, duration: b.duration })) });
}

async function apiBook(request, env) {
  const cfg = await getSettings(env);
  let body;
  try { body = await request.json(); } catch { throw new HttpError(400, "Невалидна заявка."); }
  if (body.website) return json({ ok: true }); // honeypot for bots

  const svc = svcOf(cfg, body.service);
  const date = clean(body.date, 10), time = clean(body.time, 5);
  const name = clean(body.name, 60), phone = clean(body.phone, 20), note = clean(body.note, 300);
  if (!svc) throw new HttpError(400, "Изберете услуга.");
  if (!DATE_RE.test(date) || !TIME_RE.test(time)) throw new HttpError(400, "Изберете дата и час.");
  if (name.length < 2) throw new HttpError(400, "Въведете име.");
  if (!/^\+?[0-9 ()-]{7,20}$/.test(phone) || phone.replace(/\D/g, "").length < 7) throw new HttpError(400, "Въведете валиден телефон.");

  const db = await getDB(env);
  const list = await dayBookings(db, date);
  const now = nowInZone(cfg.timeZone);
  if (!availableStarts(cfg, date, svc.duration, list, now).includes(time)) {
    throw new HttpError(409, "Този час току-що беше зает. Моля, изберете друг.", "TAKEN");
  }
  const b = {
    id: crypto.randomUUID(), date, time, duration: svc.duration, service: svc.id,
    name, phone, note, source: "online", created: new Date().toISOString(),
  };
  if (!(await insertBooking(db, cfg, b))) throw new HttpError(409, "Този час току-що беше зает. Моля, изберете друг.", "TAKEN");

  const origin = env.SITE_URL || new URL(request.url).origin;
  const notified = await sendTelegram(env, bookingMessage(cfg, b, svc, origin));
  return json({ ok: true, booking: { date, time, service: svc.id }, notified });
}

// ---------------------------------------------------------------------
//  Admin API
// ---------------------------------------------------------------------
function requireAdmin(request, env) {
  if (!env.ADMIN_PASSWORD) throw new HttpError(500, "ADMIN_PASSWORD не е зададена.");
  if ((request.headers.get("x-admin-key") || "") !== env.ADMIN_PASSWORD) throw new HttpError(401, "Грешна парола.");
}

async function apiAdmin(request, env) {
  requireAdmin(request, env);
  const u = new URL(request.url);
  const db = await getDB(env);
  const cfg = await getSettings(env);

  if (request.method === "GET") {
    const from = u.searchParams.get("from") || nowInZone(cfg.timeZone).date;
    const days = int(u.searchParams.get("days"), 1, 120, 30);
    if (!DATE_RE.test(from)) throw new HttpError(400, "Невалидна дата.");
    const to = addDays(from, days - 1);
    const r = await db.prepare("SELECT * FROM bookings WHERE date >= ? AND date <= ? ORDER BY date, start_min").bind(from, to).all();
    const byDay = new Map();
    for (const b of r.results || []) {
      if (!byDay.has(b.date)) byDay.set(b.date, []);
      byDay.get(b.date).push(b);
    }
    return json({ days: [...byDay].map(([date, bookings]) => ({ date, bookings })) });
  }

  if (request.method === "POST") {
    let body;
    try { body = await request.json(); } catch { throw new HttpError(400, "Невалидна заявка."); }
    const date = clean(body.date, 10), time = clean(body.time, 5);
    if (!DATE_RE.test(date) || !TIME_RE.test(time)) throw new HttpError(400, "Изберете дата и час.");
    if (date < nowInZone(cfg.timeZone).date) throw new HttpError(400, "Датата е в миналото.");
    const isBlock = body.type === "block";
    let service, duration, name, phone;
    if (isBlock) {
      duration = Number(body.duration);
      if (!Number.isInteger(duration) || duration < 10 || duration > 720) throw new HttpError(400, "Невалидна продължителност.");
      service = "block"; name = clean(body.name, 60) || "Блокиран час"; phone = "";
    } else {
      const svc = svcOf(cfg, body.service);
      if (!svc) throw new HttpError(400, "Изберете услуга.");
      service = svc.id; duration = svc.duration;
      name = clean(body.name, 60); phone = clean(body.phone, 20);
      if (name.length < 2) throw new HttpError(400, "Въведете име.");
      if (phone && !/^\+?[0-9 ()-]{7,20}$/.test(phone)) throw new HttpError(400, "Невалиден телефон.");
    }
    const h = dayHours(cfg, date);
    if (!h) throw new HttpError(409, "Почивен ден.");
    const t = toMin(time);
    if (t < toMin(h[0]) || t + duration > toMin(h[1])) throw new HttpError(409, "Извън работното време.");
    const b = {
      id: crypto.randomUUID(), date, time, duration, service, name, phone,
      note: clean(body.note, 300), source: isBlock ? "block" : "phone", created: new Date().toISOString(),
    };
    if (!(await insertBooking(db, cfg, b))) throw new HttpError(409, "Часът вече е зает.");
    return json({ ok: true, booking: b });
  }

  if (request.method === "DELETE") {
    const id = u.searchParams.get("id") || "";
    const b = await db.prepare("SELECT * FROM bookings WHERE id = ?").bind(id).first();
    if (!b) throw new HttpError(404, "Резервацията не е намерена.");
    await db.prepare("DELETE FROM bookings WHERE id = ?").bind(id).run();
    if (b.source === "online") {
      const svc = svcOf(cfg, b.service);
      await sendTelegram(env, [
        "❌ ОТМЕНЕНА РЕЗЕРВАЦИЯ", `🏪 ${cfg.name}`,
        `📅 ${formatDateBG(b.date)} · 🕐 ${b.time}`,
        `✂️ ${svc ? svc.name : b.service}`, `👤 ${b.name} · 📞 ${b.phone}`,
      ].join("\n"));
    }
    return json({ ok: true });
  }
  throw new HttpError(405, "Методът не се поддържа.");
}

async function apiAdminSettings(request, env) {
  requireAdmin(request, env);
  if (request.method === "GET") return json(await getSettings(env));
  if (request.method === "PUT") {
    let body;
    try { body = await request.json(); } catch { throw new HttpError(400, "Невалидни данни."); }
    const current = await getSettings(env);
    const next = sanitizeSettings(body, current);
    await saveSettings(env, next);
    return json({ ok: true, settings: next });
  }
  throw new HttpError(405, "Методът не се поддържа.");
}

async function apiAdminMedia(request, env) {
  requireAdmin(request, env);
  const name = new URL(request.url).searchParams.get("name") || "";
  if (!MEDIA_NAMES.includes(name)) throw new HttpError(400, "Невалидно име на файл.");
  const db = await getDB(env);
  const cfg = await getSettings(env);
  const gallery = (cfg.gallery || []).filter((g) => g !== name);

  if (request.method === "POST") {
    const type = (request.headers.get("content-type") || "").split(";")[0].trim();
    if (!MEDIA_TYPES.includes(type)) throw new HttpError(400, "Позволени са само JPG, PNG и WEBP.");
    const buf = new Uint8Array(await request.arrayBuffer());
    if (!buf.length || buf.length > 1400000) throw new HttpError(400, "Снимката е твърде голяма (макс. 1,4 MB).");
    let bin = "";
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    await db.prepare(`INSERT INTO media (name, type, data, updated) VALUES (?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET type = excluded.type, data = excluded.data, updated = excluded.updated`)
      .bind(name, type, btoa(bin), Date.now()).run();
    const next = { ...cfg, mediaVersion: Date.now() };
    if (name === "logo") next.logo = "logo";
    else next.gallery = [...gallery, name].sort();
    await saveSettings(env, next);
    return json({ ok: true, settings: next });
  }
  if (request.method === "DELETE") {
    await db.prepare("DELETE FROM media WHERE name = ?").bind(name).run();
    const next = { ...cfg, mediaVersion: Date.now() };
    if (name === "logo") next.logo = "";
    else next.gallery = gallery;
    await saveSettings(env, next);
    return json({ ok: true, settings: next });
  }
  throw new HttpError(405, "Методът не се поддържа.");
}

// ---------------------------------------------------------------------
//  Page (SEO is generated on the server)
// ---------------------------------------------------------------------
const DAY_SCHEMA = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function mediaUrl(cfg, name) {
  return `/media/${name}?v=${cfg.mediaVersion || 1}`;
}

function renderIndex(cfg, origin) {
  const title = cfg.seoTitle || `${cfg.name} — Барбершоп ${cfg.city} | Онлайн резервация`;
  const desc = cfg.seoDescription || `${cfg.name} в ${cfg.city}: ${(cfg.services || []).slice(0, 4).map((s) => s.name.toLowerCase()).join(", ")}. Запази час онлайн за секунди.`;
  const logo = cfg.logo ? origin + mediaUrl(cfg, cfg.logo) : "";

  // working hours → schema.org (groups days with the same hours)
  const groups = new Map();
  for (let d = 0; d < 7; d++) {
    const h = cfg.hours && cfg.hours[d];
    if (!h) continue;
    const key = h.join("-");
    if (!groups.has(key)) groups.set(key, { "@type": "OpeningHoursSpecification", dayOfWeek: [], opens: h[0], closes: h[1] });
    groups.get(key).dayOfWeek.push(DAY_SCHEMA[d]);
  }
  const business = {
    "@context": "https://schema.org", "@type": "HairSalon",
    name: cfg.name, url: origin + "/", telephone: cfg.phone,
    address: { "@type": "PostalAddress", streetAddress: cfg.address, addressLocality: cfg.city, addressCountry: "BG" },
    openingHoursSpecification: [...groups.values()],
    priceRange: "€€",
  };
  if (logo) business.image = logo;
  if (cfg.lat != null && cfg.lng != null) business.geo = { "@type": "GeoCoordinates", latitude: cfg.lat, longitude: cfg.lng };
  if (cfg.mapsUrl) business.hasMap = cfg.mapsUrl;
  const same = [cfg.instagram, cfg.facebook, cfg.tiktok].filter(Boolean);
  if (same.length) business.sameAs = same;
  const offers = (cfg.services || []).filter((s) => s.price != null)
    .map((s) => ({ "@type": "Offer", name: s.name, price: String(s.price), priceCurrency: "EUR" }));
  if (offers.length) business.makesOffer = offers;
  const ld = [business];
  if ((cfg.faq || []).length) {
    ld.push({
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: cfg.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }
  const ldJson = (o) => JSON.stringify(o).replace(/</g, "\\u003c");

  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(desc)}">`,
    `<link rel="canonical" href="${esc(origin)}/">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${esc(cfg.name)} — ${esc(cfg.city)}">`,
    `<meta property="og:description" content="${esc(cfg.tagline || desc)}">`,
    `<meta property="og:url" content="${esc(origin)}/">`,
    `<meta property="og:locale" content="bg_BG">`,
    logo ? `<meta property="og:image" content="${esc(logo)}">` : "",
    logo ? `<link rel="icon" href="${esc(mediaUrl(cfg, cfg.logo))}"><link rel="apple-touch-icon" href="${esc(mediaUrl(cfg, cfg.logo))}">` :
      `<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='${cfg.bg}'/><text x='50' y='68' font-size='56' text-anchor='middle' fill='${cfg.accent}' font-family='Georgia'>${(cfg.shortName || cfg.name || "B")[0]}</text></svg>`)}">`,
    ...ld.map((o) => `<script type="application/ld+json">${ldJson(o)}</script>`),
  ].join("\n");

  const tokens = {
    name: cfg.name, shortName: cfg.shortName || cfg.name, subName: cfg.subName, city: cfg.city,
    tagline: cfg.tagline, heroTitle1: cfg.heroTitle1, heroTitle2: cfg.heroTitle2, heroText: cfg.heroText,
    phone: cfg.phone, phoneDisplay: phoneDisplay(cfg.phone), address: cfg.address, eyebrow: cfg.eyebrow,
  };
  const pub = { ...cfg };
  delete pub.seoTitle; delete pub.seoDescription;

  const onGold = luminance(cfg.accent) > 0.18 ? "#16130c" : "#ffffff";
  return ASSETS["/index.html"].s
    .replace(/\{\{(\w+)\}\}/g, (_, k) => esc(tokens[k] ?? ""))
    .replace("<!--HEAD-->", () => head)
    .replace("/*THEME*/", () => `:root{--gold:${cfg.accent};--bg:${cfg.bg};--on-gold:${onGold}}`)
    .replace('"__SITE__"', () => JSON.stringify(pub).replace(/</g, "\\u003c"));
}

function serveAsset(path) {
  const a = ASSETS[path];
  if (!a) return null;
  const body = a.s !== undefined ? a.s : Uint8Array.from(atob(a.b), (c) => c.charCodeAt(0));
  return new Response(body, { headers: { "content-type": a.t, "cache-control": "public, max-age=300" } });
}

// ---------------------------------------------------------------------
//  Routing
// ---------------------------------------------------------------------
export default {
  async fetch(request, env) {
    const u = new URL(request.url);
    const p = u.pathname.replace(/\/+$/, "") || "/";
    const origin = env.SITE_URL ? String(env.SITE_URL).replace(/\/+$/, "") : u.origin;
    try {
      if (p.startsWith("/api/")) {
        if (p === "/api/slots" && request.method === "GET") return await apiSlots(request, env);
        if (p === "/api/book" && request.method === "POST") return await apiBook(request, env);
        if (p === "/api/admin") return await apiAdmin(request, env);
        if (p === "/api/admin/settings") return await apiAdminSettings(request, env);
        if (p === "/api/admin/media") return await apiAdminMedia(request, env);
        throw new HttpError(404, "Не е намерено.");
      }
      if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405 });
      if (p.startsWith("/media/")) return await serveMedia(env, p.slice(7), request);
      if (p === "/admin" || p === "/admin.html") {
        return new Response(ASSETS["/admin.html"].s, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
      }
      if (p === "/robots.txt") {
        return new Response(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${origin}/sitemap.xml\n`, { headers: { "content-type": "text/plain" } });
      }
      if (p === "/sitemap.xml") {
        return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${esc(origin)}/</loc></url></urlset>`, { headers: { "content-type": "application/xml" } });
      }
      if (p === "/" || p === "/index.html") {
        const cfg = await getSettings(env);
        return new Response(renderIndex(cfg, origin), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
      }
      const asset = serveAsset(p);
      if (asset) return asset;
      return Response.redirect(origin + "/", 302);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message, code: e.code }, e.status);
      return json({ error: "Сървърна грешка. Опитайте отново." }, 500);
    }
  },
};
