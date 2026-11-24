// Shared time-slot logic, used by both the website and the server.
// Every function receives the settings (cfg); none of them reads global values.

export const WEEKDAYS = ["Неделя", "Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък", "Събота"];
export const WEEKDAYS_SHORT = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
export const MONTHS_SHORT = ["яну", "фев", "мар", "апр", "май", "юни", "юли", "авг", "сеп", "окт", "ное", "дек"];

export function toMin(t) {
  const [h, m] = String(t).split(":").map(Number);
  return h * 60 + m;
}

export function fromMin(n) {
  return String(Math.floor(n / 60)).padStart(2, "0") + ":" + String(n % 60).padStart(2, "0");
}

export function nowInZone(tz = "Europe/Sofia", date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function weekday(dateStr) {
  return new Date(dateStr + "T12:00:00Z").getUTCDay();
}

export function dayHours(cfg, dateStr) {
  const h = cfg.hours && cfg.hours[weekday(dateStr)];
  if (!h || (cfg.closedDates || []).includes(dateStr)) return null;
  return h;
}

export function isOpenDay(cfg, dateStr) {
  return !!dayHours(cfg, dateStr);
}

export function overlapCount(busy, start, duration) {
  return busy.filter((b) => {
    const s = toMin(b.time);
    return start < s + b.duration && s < start + duration;
  }).length;
}

// busy = [{ time: "10:00", duration: 30 }, ...]
export function availableStarts(cfg, dateStr, duration, busy = [], now = nowInZone(cfg.timeZone)) {
  if (dateStr < now.date || dateStr > addDays(now.date, cfg.maxDaysAhead)) return [];
  const h = dayHours(cfg, dateStr);
  if (!h) return [];
  const [open, close] = h.map(toMin);
  const out = [];
  for (let t = open; t + duration <= close; t += cfg.slotStep) {
    if (dateStr === now.date && t < now.minutes + cfg.minLeadMinutes) continue;
    if (overlapCount(busy, t, duration) >= cfg.chairs) continue;
    out.push(fromMin(t));
  }
  return out;
}

export function bookableDates(cfg, now = nowInZone(cfg.timeZone)) {
  const out = [];
  const shortest = Math.min(...(cfg.services || []).map((s) => s.duration), 600);
  for (let i = 0; i <= cfg.maxDaysAhead; i++) {
    const d = addDays(now.date, i);
    if (!isOpenDay(cfg, d)) continue;
    if (i === 0 && !availableStarts(cfg, d, shortest, [], now).length) continue;
    out.push(d);
  }
  return out;
}

export function formatDateBG(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${WEEKDAYS[weekday(dateStr)]}, ${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}

export function phoneDisplay(phone) {
  const p = String(phone || "").replace(/[^\d+]/g, "");
  if (p.startsWith("+359") && p.length === 13) {
    const r = "0" + p.slice(4);
    return `${r.slice(0, 4)} ${r.slice(4, 7)} ${r.slice(7)}`;
  }
  return phone || "";
}

export function priceText(p) {
  return p == null || p === "" ? "по запитване" : `${p} €`;
}

export function durText(m) {
  if (m < 60) return `${m} мин`;
  const h = m / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1)} ч`;
}
