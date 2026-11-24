// =====================================================================
//  BARBER BOOKING WORKER — preset: default — 2026-11-24
//  Generated automatically (node build.mjs default). Do not edit by hand —
//  use the admin panel (/admin → Настройки) instead.
// =====================================================================

// ---------- booking.js ----------
// Shared time-slot logic, used by both the website and the server.
// Every function receives the settings (cfg); none of them reads global values.

const WEEKDAYS = ["Неделя", "Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък", "Събота"];
const WEEKDAYS_SHORT = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MONTHS_SHORT = ["яну", "фев", "мар", "апр", "май", "юни", "юли", "авг", "сеп", "окт", "ное", "дек"];

function toMin(t) {
  const [h, m] = String(t).split(":").map(Number);
  return h * 60 + m;
}

function fromMin(n) {
  return String(Math.floor(n / 60)).padStart(2, "0") + ":" + String(n % 60).padStart(2, "0");
}

function nowInZone(tz = "Europe/Sofia", date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function weekday(dateStr) {
  return new Date(dateStr + "T12:00:00Z").getUTCDay();
}

function dayHours(cfg, dateStr) {
  const h = cfg.hours && cfg.hours[weekday(dateStr)];
  if (!h || (cfg.closedDates || []).includes(dateStr)) return null;
  return h;
}

function isOpenDay(cfg, dateStr) {
  return !!dayHours(cfg, dateStr);
}

function overlapCount(busy, start, duration) {
  return busy.filter((b) => {
    const s = toMin(b.time);
    return start < s + b.duration && s < start + duration;
  }).length;
}

// busy = [{ time: "10:00", duration: 30 }, ...]
function availableStarts(cfg, dateStr, duration, busy = [], now = nowInZone(cfg.timeZone)) {
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

function bookableDates(cfg, now = nowInZone(cfg.timeZone)) {
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

function formatDateBG(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${WEEKDAYS[weekday(dateStr)]}, ${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}

function phoneDisplay(phone) {
  const p = String(phone || "").replace(/[^\d+]/g, "");
  if (p.startsWith("+359") && p.length === 13) {
    const r = "0" + p.slice(4);
    return `${r.slice(0, 4)} ${r.slice(4, 7)} ${r.slice(7)}`;
  }
  return phone || "";
}

function priceText(p) {
  return p == null || p === "" ? "по запитване" : `${p} €`;
}

function durText(m) {
  if (m < 60) return `${m} мин`;
  const h = m / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1)} ч`;
}


// ---------- embedded settings and files ----------
const PRESET = {"timeZone":"Europe/Sofia","name":"Barber Shop","shortName":"BARBER","subName":"SHOP","city":"Варна","eyebrow":"Барбершоп · Варна","tagline":"Твоят стил. Нашата грижа.","heroTitle1":"Barber","heroTitle2":"Shop","heroText":"Прецизна подстрижка и оформена брада в спокойна атмосфера. Запази час онлайн за секунди.","phone":"+359888123456","address":"ул. „Примерна“ 1, Варна","instagram":"","facebook":"","tiktok":"","mapsUrl":"","lat":null,"lng":null,"accent":"#c9a45c","bg":"#0b0b0d","seoTitle":"","seoDescription":"","logo":"","gallery":[],"mediaVersion":1795522591096,"badges":[{"title":"Прецизност","text":"във всеки детайл"},{"title":"Good Hair","text":"Good Mood"}],"marquee":["Стил","Качество","Доверие","Подстрижка","Брада","Фейд"],"hours":{"0":null,"1":["09:00","19:00"],"2":["09:00","19:00"],"3":["09:00","19:00"],"4":["09:00","19:00"],"5":["09:00","19:00"],"6":["10:00","16:00"]},"chairs":1,"slotStep":30,"minLeadMinutes":60,"maxDaysAhead":21,"closedDates":[],"services":[{"id":"haircut","name":"Мъжка подстрижка","desc":"Консултация, подстрижка и оформяне.","price":20,"duration":30,"icon":"scissors","featured":true},{"id":"beard","name":"Оформяне на брада","desc":"Контур, оформяне и грижа с топла кърпа.","price":12,"duration":30,"icon":"beard","featured":false},{"id":"combo","name":"Подстрижка + брада","desc":"Пълната визия — коса и брада.","price":28,"duration":60,"icon":"crown","featured":true},{"id":"kids","name":"Детска подстрижка","desc":"За деца до 12 години.","price":15,"duration":30,"icon":"child","featured":false}],"offer":{"enabled":true,"eyebrow":"Топ оферта","title":"Подстрижка + брада","price":28,"priceNote":"пълна визия","items":["Консултация","Подстрижка","Оформяне на брада","Топла кърпа","Измиване","Стайлинг"],"serviceId":"combo"},"highlights":[{"icon":"coffee","title":"Кафе от нас","text":"Отпуснете се, докато чакате."},{"icon":"clock","title":"Без чакане","text":"Запазвате час онлайн и идвате навреме."}],"faq":[{"q":"Как да запазя час?","a":"Изберете услуга, ден и свободен час от онлайн формата и оставете име и телефон. Можете и да се обадите."},{"q":"Как да отменя или преместя час?","a":"Обадете се или ни пишете в социалните мрежи — ще намерим нов удобен час."}]};
const ASSETS = {"/index.html":{"t":"text/html; charset=utf-8","s":"<!doctype html>\n<html lang=\"bg\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n<!--HEAD-->\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n<link href=\"https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap\" rel=\"stylesheet\">\n<style>\n\n/*THEME*/\n:root{\n  --gold2:color-mix(in srgb,var(--gold) 58%,#fff); --gold3:color-mix(in srgb,var(--gold) 72%,#000);\n  --gold-dim:color-mix(in srgb,var(--gold) 14%,transparent);\n  --bg2:color-mix(in srgb,var(--bg) 95%,#fff); --card:color-mix(in srgb,var(--bg) 91%,#fff);\n  --field:color-mix(in srgb,var(--bg) 97%,#fff);\n  --line:rgba(255,255,255,.08); --text:#ece9e2; --muted:#9d9a93;\n  --radius:18px;\n  --serif:\"Playfair Display\", Georgia, serif;\n  --sans:\"Manrope\", system-ui, -apple-system, Segoe UI, sans-serif;\n}\n*{box-sizing:border-box;margin:0;padding:0}\nhtml{scroll-behavior:smooth;scroll-padding-top:80px}\nbody{background:var(--bg);color:var(--text);font-family:var(--sans);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}\nimg{max-width:100%;display:block}\na{color:inherit;text-decoration:none}\nbutton{font:inherit;cursor:pointer;border:0;background:none;color:inherit}\n.wrap{max-width:1180px;margin:0 auto;padding:0 20px}\n.gold-text{background:linear-gradient(100deg,var(--gold) 0%,var(--gold2) 45%,var(--gold) 70%,var(--gold3) 100%);-webkit-background-clip:text;background-clip:text;color:transparent}\n.eyebrow{font-size:.75rem;letter-spacing:.32em;text-transform:uppercase;color:var(--gold);font-weight:600}\nh2.title{font-family:var(--serif);font-weight:600;font-size:clamp(2rem,4.4vw,3.1rem);line-height:1.12;margin:.5rem 0 1rem}\n.lead{color:var(--muted);max-width:560px}\nsection{padding:100px 0;position:relative}\n\n.btn{display:inline-flex;align-items:center;justify-content:center;gap:.6rem;padding:15px 28px;border-radius:999px;font-weight:700;font-size:.95rem;letter-spacing:.02em;transition:transform .2s, box-shadow .2s, background .2s}\n.btn-gold{background:linear-gradient(135deg,var(--gold2),var(--gold) 55%,var(--gold3));color:var(--on-gold);box-shadow:0 10px 30px -10px color-mix(in srgb,var(--gold) 60%,transparent)}\n.btn-gold:hover{transform:translateY(-2px);box-shadow:0 16px 40px -12px color-mix(in srgb,var(--gold) 75%,transparent)}\n.btn-ghost{border:1px solid rgba(255,255,255,.2);color:var(--text)}\n.btn-ghost:hover{border-color:var(--gold);color:var(--gold2)}\n.btn svg{width:18px;height:18px}\n\n/* NAV */\n.nav{position:fixed;inset:0 0 auto;z-index:50;transition:background .3s,border-color .3s;border-bottom:1px solid transparent}\n.nav.scrolled{background:color-mix(in srgb,var(--bg) 86%,transparent);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-color:var(--line)}\n.nav .wrap{display:flex;align-items:center;justify-content:space-between;height:72px}\n.brand{display:flex;align-items:center;gap:12px}\n.brand img{width:42px;height:42px;border-radius:50%;border:1px solid color-mix(in srgb,var(--gold) 40%,transparent)}\n.brand b{font-family:var(--serif);font-size:1.15rem;letter-spacing:.06em;font-weight:600}\n.brand small{display:block;font-size:.62rem;letter-spacing:.35em;color:var(--muted);margin-top:-3px}\n.nav-links{display:flex;gap:30px;align-items:center;font-size:.9rem;font-weight:500}\n.nav-links a:not(.btn){color:#c8c5be;transition:color .2s}\n.nav-links a:not(.btn):hover{color:var(--gold2)}\n.nav-links .btn{padding:11px 22px}\n.burger{display:none;width:44px;height:44px;border-radius:12px;border:1px solid var(--line);align-items:center;justify-content:center}\n.burger span,.burger span::before,.burger span::after{display:block;width:18px;height:2px;background:var(--text);position:relative;transition:.3s}\n.burger span::before,.burger span::after{content:\"\";position:absolute}\n.burger span::before{top:-6px}.burger span::after{top:6px}\n.nav.open .burger span{background:transparent}\n.nav.open .burger span::before{top:0;transform:rotate(45deg)}\n.nav.open .burger span::after{top:0;transform:rotate(-45deg)}\n\n/* HERO */\n.hero{min-height:100vh;min-height:100svh;display:flex;align-items:center;padding:120px 0 80px;overflow:hidden}\n.hero::before{content:\"\";position:absolute;inset:0;background:\n  radial-gradient(60% 50% at 75% 40%,color-mix(in srgb,var(--gold) 16%,transparent),transparent 70%),\n  radial-gradient(50% 60% at 10% 90%,rgba(34,36,58,.9),transparent 70%),\n  var(--bg);z-index:-2}\n.hero::after{content:\"\";position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.05) 1px,transparent 1px);background-size:26px 26px;mask-image:radial-gradient(70% 70% at 70% 45%,#000,transparent);z-index:-1}\n.hero-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:60px;align-items:center}\n.hero h1{font-family:var(--serif);font-weight:600;font-size:clamp(3rem,8vw,6.2rem);line-height:.95;letter-spacing:.01em;margin:18px 0 8px}\n.hero h1 span{display:block}\n.hero .tag{font-size:clamp(1.05rem,2vw,1.3rem);color:#cfcbc2;margin:22px 0 34px;max-width:480px}\n.hero .tag em{font-style:normal;color:var(--gold2)}\n.hero-cta{display:flex;flex-wrap:wrap;gap:14px}\n.hero-meta{display:flex;gap:28px;margin-top:46px;flex-wrap:wrap}\n.hero-meta div{font-size:.82rem;color:var(--muted)}\n.hero-meta strong{display:block;font-family:var(--serif);font-size:1.6rem;color:var(--text);font-weight:600}\n.emblem{position:relative;aspect-ratio:1;max-width:440px;margin-left:auto;width:100%}\n.emblem .ring{position:absolute;inset:0;border-radius:50%;border:1px solid color-mix(in srgb,var(--gold) 25%,transparent)}\n.emblem .ring.r2{inset:7%;border-style:dashed;border-color:color-mix(in srgb,var(--gold) 18%,transparent);animation:spin 60s linear infinite}\n.emblem .ring.r3{inset:16%;background:radial-gradient(circle at 50% 35%,#2a2c45,#14141c 70%);border-color:rgba(255,255,255,.08);box-shadow:inset 0 0 60px rgba(0,0,0,.6),0 30px 80px -30px color-mix(in srgb,var(--gold) 35%,transparent)}\n.emblem .disc{position:absolute;inset:16%;width:68%;height:68%;border-radius:50%;object-fit:cover;transform:scale(1.02)}\n.emblem .badge svg{width:20px;height:20px;flex:none;color:var(--gold2)}\n.emblem .badge{position:absolute;background:color-mix(in srgb,var(--card) 92%,transparent);border:1px solid var(--line);backdrop-filter:blur(8px);border-radius:14px;padding:12px 16px;font-size:.8rem;display:flex;gap:10px;align-items:center;box-shadow:0 20px 40px -20px #000}\n.emblem .badge b{color:var(--gold2);font-size:1.05rem}\n.emblem .b1{left:-6%;top:16%}\n.emblem .b2{right:-4%;bottom:14%}\n@keyframes spin{to{transform:rotate(360deg)}}\n\n/* VALUES STRIP */\n.strip{border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--bg2);overflow:hidden;padding:0}\n.marquee{display:flex;gap:56px;padding:22px 0;width:max-content;animation:marq 32s linear infinite}\n.marquee span{display:flex;align-items:center;gap:56px;font-family:var(--serif);font-size:1.25rem;letter-spacing:.08em;color:#cfcbc2;white-space:nowrap}\n.marquee span::after{content:\"✦\";color:var(--gold);font-size:.8rem}\n@keyframes marq{to{transform:translateX(-50%)}}\n\n/* SERVICES */\n.sec-head{display:flex;justify-content:space-between;align-items:end;gap:30px;flex-wrap:wrap;margin-bottom:46px}\n.services{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}\n.svc{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:28px 24px;display:flex;flex-direction:column;gap:14px;transition:border-color .3s,transform .3s;position:relative;overflow:hidden}\n.svc:hover{border-color:color-mix(in srgb,var(--gold) 45%,transparent);transform:translateY(-4px)}\n.svc .ic{width:52px;height:52px;border-radius:14px;background:var(--gold-dim);display:grid;place-items:center;color:var(--gold2)}\n.svc .ic svg{width:26px;height:26px}\n.svc h3{font-family:var(--serif);font-weight:600;font-size:1.3rem}\n.svc p{color:var(--muted);font-size:.92rem;flex:1}\n.svc .row{display:flex;justify-content:space-between;align-items:center;padding-top:16px;border-top:1px solid var(--line)}\n.svc .price{font-family:var(--serif);font-size:1.6rem;font-weight:600}\n.svc .price.ask{font-family:var(--sans);font-size:.9rem;color:var(--muted);font-weight:500}\n.svc .dur{font-size:.78rem;color:var(--muted)}\n.svc .pick{font-size:.85rem;font-weight:700;color:var(--gold2);display:flex;align-items:center;gap:6px}\n.svc.featured{background:linear-gradient(160deg,color-mix(in srgb,var(--gold) 9%,var(--card)),var(--card) 60%);border-color:color-mix(in srgb,var(--gold) 35%,transparent)}\n.svc .flag{position:absolute;top:18px;right:18px;font-size:.66rem;letter-spacing:.18em;text-transform:uppercase;background:var(--gold);color:var(--on-gold);padding:4px 10px;border-radius:99px;font-weight:700}\n\n/* OFFER */\n.offer{background:var(--bg2);overflow:hidden}\n.offer-card{display:grid;grid-template-columns:1fr 1fr;border-radius:28px;overflow:hidden;border:1px solid color-mix(in srgb,var(--gold) 30%,transparent);background:linear-gradient(135deg,color-mix(in srgb,var(--gold) 7%,var(--bg2)),var(--bg2) 60%)}\n.offer-left{padding:56px}\n.offer-left .big{font-family:var(--serif);font-size:clamp(4.5rem,10vw,7.5rem);line-height:1;font-weight:700;margin:16px 0 8px}\n.offer-left .big small{font-size:.38em;color:var(--muted);font-weight:500;font-family:var(--sans)}\n.includes{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:26px 0 34px}\n.includes div{display:flex;align-items:center;gap:10px;font-size:.95rem}\n.includes div::before{content:\"✓\";width:22px;height:22px;flex:none;border-radius:50%;background:var(--gold-dim);color:var(--gold2);display:grid;place-items:center;font-size:.72rem;font-weight:800}\n.offer-right{padding:56px;border-left:1px solid var(--line);display:flex;flex-direction:column;gap:22px;justify-content:center;background:radial-gradient(80% 80% at 80% 20%,color-mix(in srgb,var(--gold) 12%,transparent),transparent)}\n.mini{background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:18px;padding:24px;display:flex;gap:18px;align-items:center}\n.mini .ic{width:54px;height:54px;flex:none;border-radius:50%;background:var(--gold-dim);display:grid;place-items:center;color:var(--gold2)}\n.mini .ic svg{width:26px;height:26px}\n.mini h4{font-family:var(--serif);font-size:1.2rem;font-weight:600}\n.mini p{color:var(--muted);font-size:.88rem}\n.mini .p{margin-left:auto;font-family:var(--serif);font-size:1.7rem;font-weight:700;color:var(--gold2);white-space:nowrap}\n\n/* GALLERY */\n.gallery{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:230px;gap:14px}\n.gallery figure{border-radius:16px;overflow:hidden;background:var(--card);position:relative}\n.gallery figure:nth-child(1){grid-row:span 2}\n.gallery figure:nth-child(4){grid-column:span 2}\n.gallery img{width:100%;height:100%;object-fit:cover;transition:transform .6s}\n.gallery figure:hover img{transform:scale(1.05)}\n.gallery-cta{margin-top:30px;text-align:center}\n\n/* BOOKING */\n.booking{background:\n  radial-gradient(50% 40% at 15% 10%,color-mix(in srgb,var(--gold) 10%,transparent),transparent 70%),\n  radial-gradient(60% 50% at 90% 90%,rgba(34,36,58,.8),transparent 70%), var(--bg)}\n.book-grid{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:50px;align-items:start}\n.book-grid>*,.panel,.step,.dates,.times{min-width:0;max-width:100%}\n.book-info ul{list-style:none;margin-top:30px;display:grid;gap:18px}\n.book-info li{display:flex;gap:14px;align-items:flex-start;color:#cfcbc2}\n.book-info li i{font-style:normal;width:30px;height:30px;flex:none;border-radius:50%;border:1px solid color-mix(in srgb,var(--gold) 50%,transparent);display:grid;place-items:center;color:var(--gold2);font-size:.8rem;font-weight:700}\n.panel{background:color-mix(in srgb,var(--card) 90%,transparent);border:1px solid var(--line);border-radius:26px;padding:34px;box-shadow:0 40px 80px -40px #000}\n.step{margin-bottom:28px}\n.step-label{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}\n.step-label h4{font-size:.78rem;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);font-weight:600}\n.step-label span{font-size:.8rem;color:var(--gold2)}\n.svc-pick{display:grid;grid-template-columns:1fr 1fr;gap:10px}\n.opt{border:1px solid var(--line);border-radius:14px;padding:14px 16px;text-align:left;transition:.2s;background:rgba(255,255,255,.02)}\n.opt:hover{border-color:color-mix(in srgb,var(--gold) 40%,transparent)}\n.opt b{display:block;font-size:.95rem}\n.opt small{color:var(--muted);font-size:.8rem}\n.opt[aria-pressed=\"true\"]{border-color:var(--gold);background:var(--gold-dim);box-shadow:inset 0 0 0 1px var(--gold)}\n.dates{display:flex;gap:10px;overflow-x:auto;padding-bottom:8px;scroll-snap-type:x mandatory;scrollbar-width:thin}\n.dates::-webkit-scrollbar{height:5px}.dates::-webkit-scrollbar-thumb{background:#333;border-radius:9px}\n.date{flex:none;width:68px;padding:12px 0;border-radius:14px;border:1px solid var(--line);text-align:center;scroll-snap-align:start;transition:.2s;background:rgba(255,255,255,.02)}\n.date small{display:block;font-size:.7rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}\n.date b{display:block;font-family:var(--serif);font-size:1.5rem;line-height:1.2}\n.date em{font-style:normal;font-size:.7rem;color:var(--muted)}\n.date:hover{border-color:color-mix(in srgb,var(--gold) 40%,transparent)}\n.date[aria-pressed=\"true\"]{background:linear-gradient(160deg,var(--gold2),var(--gold));color:var(--on-gold);border-color:var(--gold)}\n.date[aria-pressed=\"true\"] small,.date[aria-pressed=\"true\"] em{color:color-mix(in srgb,var(--on-gold) 70%,transparent)}\n.times{display:grid;grid-template-columns:repeat(auto-fill,minmax(78px,1fr));gap:8px;min-height:46px}\n.time{padding:11px 0;border-radius:11px;border:1px solid var(--line);font-weight:600;font-size:.92rem;background:rgba(255,255,255,.02);transition:.2s}\n.time:hover{border-color:color-mix(in srgb,var(--gold) 50%,transparent)}\n.time[aria-pressed=\"true\"]{background:var(--gold);color:var(--on-gold);border-color:var(--gold)}\n.hint{color:var(--muted);font-size:.88rem;padding:12px 0;grid-column:1/-1}\n.skeleton{height:44px;border-radius:11px;background:linear-gradient(90deg,#1c1c22,#26262d,#1c1c22);background-size:200% 100%;animation:sh 1.2s infinite}\n@keyframes sh{to{background-position:-200% 0}}\n.fields{display:grid;grid-template-columns:1fr 1fr;gap:12px}\n.fields .full{grid-column:1/-1}\n.field label{display:block;font-size:.78rem;color:var(--muted);margin-bottom:6px;font-weight:600}\n.field input,.field textarea{width:100%;background:var(--field);border:1px solid var(--line);border-radius:12px;padding:14px 15px;color:var(--text);font:inherit;font-size:16px;transition:border-color .2s}\n.field textarea{resize:vertical;min-height:70px}\n.field input:focus,.field textarea:focus{outline:none;border-color:var(--gold)}\n.hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}\n.summary{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:24px;padding-top:24px;border-top:1px solid var(--line);flex-wrap:wrap}\n.summary p{font-size:.9rem;color:var(--muted)}\n.summary p b{color:var(--text)}\n.summary .btn{min-width:200px}\n.summary .btn[disabled]{opacity:.45;cursor:not-allowed;transform:none;box-shadow:none}\n.error{color:#ff8f7a;font-size:.88rem;margin-top:12px;min-height:1.2em}\n.success{text-align:center;padding:30px 10px}\n.success .check{width:84px;height:84px;margin:0 auto 22px;border-radius:50%;background:var(--gold-dim);display:grid;place-items:center;color:var(--gold2);animation:pop .5s cubic-bezier(.2,1.6,.4,1)}\n.success .check svg{width:40px;height:40px}\n.success h3{font-family:var(--serif);font-size:2rem;font-weight:600;margin-bottom:8px}\n.success .when{display:inline-block;margin:18px 0;padding:16px 26px;border-radius:16px;border:1px solid color-mix(in srgb,var(--gold) 35%,transparent);background:color-mix(in srgb,var(--gold) 6%,transparent)}\n.success .when b{display:block;font-family:var(--serif);font-size:1.35rem;color:var(--gold2)}\n.success p{color:var(--muted);font-size:.92rem;max-width:400px;margin:0 auto}\n@keyframes pop{from{transform:scale(.4);opacity:0}}\n\n/* FAQ */\n.faq{max-width:820px;margin:0 auto}\n.faq details{border-bottom:1px solid var(--line);padding:22px 0}\n.faq summary{list-style:none;display:flex;justify-content:space-between;align-items:center;gap:20px;cursor:pointer;font-family:var(--serif);font-size:1.25rem;font-weight:500}\n.faq summary::-webkit-details-marker{display:none}\n.faq summary::after{content:\"+\";font-family:var(--sans);font-size:1.5rem;color:var(--gold);transition:transform .3s}\n.faq details[open] summary::after{transform:rotate(45deg)}\n.faq details p{color:var(--muted);margin-top:12px;max-width:680px}\n\n/* CONTACT */\n.contact{background:var(--bg2)}\n.contact-grid{display:grid;grid-template-columns:1fr 1.2fr;gap:24px}\n.c-card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:34px}\n.c-item{display:flex;gap:16px;padding:18px 0;border-bottom:1px solid var(--line)}\n.c-item:last-of-type{border-bottom:0}\n.c-item .ic{width:44px;height:44px;flex:none;border-radius:12px;background:var(--gold-dim);display:grid;place-items:center;color:var(--gold2)}\n.c-item .ic svg{width:20px;height:20px}\n.c-item small{display:block;color:var(--muted);font-size:.78rem;text-transform:uppercase;letter-spacing:.14em}\n.c-item a:hover{color:var(--gold2)}\n.hours{width:100%;border-collapse:collapse;font-size:.92rem;margin-top:6px}\n.hours td{padding:5px 0}\n.hours td:last-child{text-align:right;color:var(--muted)}\n.hours tr.today td{color:var(--gold2);font-weight:700}\n.socials{display:flex;gap:10px;margin-top:22px}\n.socials a{width:46px;height:46px;border-radius:50%;border:1px solid var(--line);display:grid;place-items:center;transition:.2s}\n.socials a:hover{border-color:var(--gold);color:var(--gold2)}\n.socials svg{width:20px;height:20px}\n.map-btns{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}\n.map-btns .btn{padding:10px 16px;font-size:.85rem}\n.map{border-radius:var(--radius);overflow:hidden;border:1px solid var(--line);min-height:420px;background:var(--card)}\n.map iframe{width:100%;height:100%;min-height:420px;border:0;filter:grayscale(1) invert(.92) contrast(.9) brightness(.9)}\n\nfooter{padding:44px 0 110px;border-top:1px solid var(--line);color:var(--muted);font-size:.85rem}\nfooter .wrap{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}\n\n/* MOBILE BAR */\n.mbar{display:none;position:fixed;left:12px;right:12px;bottom:12px;z-index:60;gap:10px;padding:10px;border-radius:20px;background:color-mix(in srgb,var(--card) 92%,transparent);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid var(--line);padding-bottom:calc(10px + env(safe-area-inset-bottom)/2)}\n.mbar .btn{flex:1;padding:14px}\n.mbar .call{flex:0 0 52px;padding:0}\n\n.reveal{opacity:0;transform:translateY(24px);transition:opacity .8s,transform .8s}\n.reveal.in{opacity:1;transform:none}\n\n@media (max-width:1020px){\n  .services{grid-template-columns:repeat(2,1fr)}\n  .hero-grid,.book-grid,.contact-grid,.offer-card{grid-template-columns:minmax(0,1fr)}\n  .offer-right{border-left:0;border-top:1px solid var(--line)}\n  .emblem{max-width:340px;margin:20px auto 0}\n  .gallery{grid-template-columns:repeat(2,1fr);grid-auto-rows:200px}\n  .gallery figure:nth-child(4){grid-column:span 1}\n}\n@media (max-width:760px){\n  section{padding:76px 0}\n  .nav-links{position:fixed;inset:72px 0 auto;background:color-mix(in srgb,var(--bg) 97%,transparent);flex-direction:column;align-items:stretch;gap:0;padding:10px 20px 24px;border-bottom:1px solid var(--line);transform:translateY(-120%);transition:transform .35s;z-index:-1}\n  .nav.open .nav-links{transform:none}\n  .nav-links a:not(.btn){padding:16px 0;border-bottom:1px solid var(--line);font-size:1.05rem}\n  .nav-links .btn{margin-top:16px}\n  .burger{display:flex}\n  .services,.includes{grid-template-columns:minmax(0,1fr)}\n  .book-info ul,.book-info .lead:last-child{display:none}\n  .book-grid{gap:26px}\n  .opt{padding:12px}\n  .opt b{font-size:.88rem;line-height:1.3}\n  .times{grid-template-columns:repeat(4,minmax(0,1fr))}\n  .offer-left,.offer-right,.panel,.c-card{padding:26px 20px}\n  .fields{grid-template-columns:1fr}\n  .mbar{display:flex}\n  .emblem .b1{left:0}.emblem .b2{right:0}\n  .hero{padding-top:100px}\n  .summary .btn{width:100%}\n  .mini{flex-wrap:wrap}\n}\n@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}.reveal{opacity:1;transform:none}}\n\n.brand .mono{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:var(--gold-dim);border:1px solid color-mix(in srgb,var(--gold) 40%,transparent);font-family:var(--serif);font-size:1.3rem;color:var(--gold2)}\n.emblem .disc{position:absolute;inset:16%;width:68%;height:68%;border-radius:50%;object-fit:cover}\n.emblem .disc-mono{position:absolute;inset:16%;display:grid;place-items:center;font-family:var(--serif);font-size:clamp(5rem,14vw,9rem);color:var(--silver,#dfe1e6);text-shadow:0 10px 30px rgba(0,0,0,.5)}\n.emblem .badge svg{width:20px;height:20px;flex:none;color:var(--gold2)}\n.map-btns{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}\n.map-btns .btn{padding:10px 16px;font-size:.85rem}\n.book-grid>*,.panel,.step,.dates,.times{min-width:0;max-width:100%}\n[hidden]{display:none!important}\n</style>\n</head>\n<body>\n\n<svg width=\"0\" height=\"0\" style=\"position:absolute\" aria-hidden=\"true\">\n  <defs>\n    <symbol id=\"i-scissors\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"6\" cy=\"6\" r=\"3\"/><circle cx=\"6\" cy=\"18\" r=\"3\"/><path d=\"M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12\"/></symbol>\n    <symbol id=\"i-beard\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 5v5c0 5 3 10 7 10s7-5 7-10V5\"/><path d=\"M9 14c1.5-1 4.5-1 6 0\"/><path d=\"M5 5c2 2 4 2 7 2s5 0 7-2\"/></symbol>\n    <symbol id=\"i-crown\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 8l4 4 5-7 5 7 4-4-2 11H5L3 8z\"/><path d=\"M5 19h14\"/></symbol>\n    <symbol id=\"i-curl\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M7 20c-3-2-3-6 0-7s4 3 1 4-3-5 1-7 6 0 6 3-3 3-3 1 4-5 7-2 1 8-3 8\"/></symbol>\n    <symbol id=\"i-coffee\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M17 8h1a4 4 0 0 1 0 8h-1\"/><path d=\"M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z\"/><path d=\"M7 2v2M11 2v2M15 2v2\"/></symbol>\n    <symbol id=\"i-clock\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v5l3 2\"/></symbol>\n    <symbol id=\"i-star\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linejoin=\"round\"><path d=\"M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z\"/></symbol>\n    <symbol id=\"i-razor\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 15l9-9 5 5-9 9z\"/><path d=\"M13 6l3-3 5 5-3 3\"/><path d=\"M7 12l5 5\"/></symbol>\n    <symbol id=\"i-card\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\"><rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"2\"/><path d=\"M3 10h18M7 15h4\"/></symbol>\n    <symbol id=\"i-child\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"6\" r=\"3\"/><path d=\"M8 21v-6l-2-3 3-2h6l3 2-2 3v6M10 21v-4h4v4\"/></symbol>\n    <symbol id=\"i-phone\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z\"/></symbol>\n    <symbol id=\"i-pin\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z\"/><circle cx=\"12\" cy=\"10\" r=\"2.5\"/></symbol>\n    <symbol id=\"i-cal\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"5\" width=\"18\" height=\"16\" rx=\"2\"/><path d=\"M16 3v4M8 3v4M3 10h18\"/></symbol>\n    <symbol id=\"i-ig\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"4\"/><circle cx=\"17.5\" cy=\"6.5\" r=\"1\" fill=\"currentColor\" stroke=\"none\"/></symbol>\n    <symbol id=\"i-fb\" viewBox=\"0 0 24 24\" fill=\"currentColor\"><path d=\"M14 8.5V6.8c0-.8.5-1.3 1.4-1.3H17V2.2C16.6 2.1 15.5 2 14.3 2 11.7 2 10 3.6 10 6.4v2.1H7.2V12H10v10h4V12h2.8l.4-3.5H14z\"/></symbol>\n    <symbol id=\"i-tt\" viewBox=\"0 0 24 24\" fill=\"currentColor\"><path d=\"M16.6 2h-3.3v13.2a2.9 2.9 0 1 1-2.1-2.8V9a6.3 6.3 0 1 0 5.4 6.2V8.5a7.6 7.6 0 0 0 4.4 1.4V6.6a4.4 4.4 0 0 1-4.4-4.6z\"/></symbol>\n    <symbol id=\"i-arrow\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 12h14M13 6l6 6-6 6\"/></symbol>\n    <symbol id=\"i-check\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 12l5 5L20 7\"/></symbol>\n  </defs>\n</svg>\n\n<header class=\"nav\" id=\"nav\">\n  <div class=\"wrap\">\n    <a href=\"#top\" class=\"brand\" aria-label=\"{{name}}\">\n      <span class=\"brand-logo\" data-logo></span>\n      <span><b>{{shortName}}</b><small>{{subName}}</small></span>\n    </a>\n    <nav class=\"nav-links\" id=\"navLinks\">\n      <a href=\"#uslugi\">Услуги</a>\n      <a href=\"#oferta\" data-if-offer>Оферти</a>\n      <a href=\"#galeria\" data-if-gallery>Галерия</a>\n      <a href=\"#kontakt\">Контакт</a>\n      <a href=\"#rezervacia\" class=\"btn btn-gold\">Запази час</a>\n    </nav>\n    <button class=\"burger\" id=\"burger\" aria-label=\"Меню\" aria-expanded=\"false\"><span></span></button>\n  </div>\n</header>\n\n<main id=\"top\">\n\n<section class=\"hero\">\n  <div class=\"wrap hero-grid\">\n    <div class=\"reveal\">\n      <div class=\"eyebrow\">{{eyebrow}}</div>\n      <h1><span>{{heroTitle1}}</span><span class=\"gold-text\">{{heroTitle2}}</span></h1>\n      <p class=\"tag\"><em>{{tagline}}</em> {{heroText}}</p>\n      <div class=\"hero-cta\">\n        <a href=\"#rezervacia\" class=\"btn btn-gold\"><svg><use href=\"#i-cal\"/></svg>Запази час онлайн</a>\n        <a href=\"tel:{{phone}}\" class=\"btn btn-ghost\"><svg><use href=\"#i-phone\"/></svg>{{phoneDisplay}}</a>\n      </div>\n      <div class=\"hero-meta\" id=\"heroMeta\"></div>\n    </div>\n    <div class=\"emblem reveal\" aria-hidden=\"true\">\n      <div class=\"ring\"></div><div class=\"ring r2\"></div><div class=\"ring r3\"></div>\n      <div id=\"emblemCenter\"></div>\n      <div class=\"badge b1\" id=\"badge1\"></div>\n      <div class=\"badge b2\" id=\"badge2\"></div>\n    </div>\n  </div>\n</section>\n\n<div class=\"strip\" aria-hidden=\"true\" id=\"strip\"><div class=\"marquee\" id=\"marquee\"></div></div>\n\n<section id=\"uslugi\">\n  <div class=\"wrap\">\n    <div class=\"sec-head reveal\">\n      <div>\n        <div class=\"eyebrow\">Услуги</div>\n        <h2 class=\"title\">Всичко за <span class=\"gold-text\">перфектния</span> вид</h2>\n      </div>\n      <p class=\"lead\">Изберете услуга и запазете час за секунди — без обаждане и без чакане.</p>\n    </div>\n    <div class=\"services\" id=\"servicesGrid\"></div>\n  </div>\n</section>\n\n<section id=\"oferta\" class=\"offer\" data-if-offer>\n  <div class=\"wrap\">\n    <div class=\"offer-card reveal\">\n      <div class=\"offer-left\">\n        <div class=\"eyebrow\" id=\"offerEyebrow\"></div>\n        <h2 class=\"title\" style=\"margin-bottom:0\" id=\"offerTitle\"></h2>\n        <div class=\"big gold-text\" id=\"offerPrice\"></div>\n        <div class=\"includes\" id=\"offerItems\"></div>\n        <a href=\"#rezervacia\" class=\"btn btn-gold\" id=\"offerBtn\">Запази сега <svg><use href=\"#i-arrow\"/></svg></a>\n      </div>\n      <div class=\"offer-right\" id=\"offerRight\"></div>\n    </div>\n  </div>\n</section>\n\n<section id=\"galeria\" data-if-gallery>\n  <div class=\"wrap\">\n    <div class=\"sec-head reveal\">\n      <div>\n        <div class=\"eyebrow\">Галерия</div>\n        <h2 class=\"title\">Нашата <span class=\"gold-text\">работа</span></h2>\n      </div>\n      <p class=\"lead\" id=\"galleryLead\">Вижте още от нашата работа в социалните мрежи.</p>\n    </div>\n    <div class=\"gallery\" id=\"gallery\"></div>\n  </div>\n</section>\n\n<section id=\"rezervacia\" class=\"booking\">\n  <div class=\"wrap book-grid\">\n    <div class=\"book-info reveal\">\n      <div class=\"eyebrow\">Онлайн резервация</div>\n      <h2 class=\"title\">Запази своя <span class=\"gold-text\">час</span> още днес</h2>\n      <p class=\"lead\">Свободните часове се обновяват в реално време. Получаваме вашата резервация веднага.</p>\n      <ul>\n        <li><i>1</i><span>Изберете услуга</span></li>\n        <li><i>2</i><span>Изберете ден и свободен час</span></li>\n        <li><i>3</i><span>Оставете име и телефон — готово!</span></li>\n      </ul>\n      <p class=\"lead\" style=\"margin-top:30px;font-size:.9rem\">Предпочитате да се обадите? <a href=\"tel:{{phone}}\" style=\"color:var(--gold2);font-weight:700\">{{phoneDisplay}}</a></p>\n    </div>\n\n    <div class=\"panel reveal\" id=\"panel\">\n      <form id=\"bookForm\" novalidate>\n        <div class=\"step\">\n          <div class=\"step-label\"><h4>1 · Услуга</h4><span id=\"svcLabel\"></span></div>\n          <div class=\"svc-pick\" id=\"svcPick\"></div>\n        </div>\n        <div class=\"step\">\n          <div class=\"step-label\"><h4>2 · Ден</h4><span id=\"dateLabel\"></span></div>\n          <div class=\"dates\" id=\"dates\"></div>\n        </div>\n        <div class=\"step\">\n          <div class=\"step-label\"><h4>3 · Час</h4><span id=\"timeLabel\"></span></div>\n          <div class=\"times\" id=\"times\"><div class=\"hint\">Първо изберете услуга и ден.</div></div>\n        </div>\n        <div class=\"step\" style=\"margin-bottom:0\">\n          <div class=\"step-label\"><h4>4 · Вашите данни</h4></div>\n          <div class=\"fields\">\n            <div class=\"field\"><label for=\"fName\">Име</label><input id=\"fName\" name=\"name\" autocomplete=\"name\" placeholder=\"Иван Иванов\" maxlength=\"60\" required></div>\n            <div class=\"field\"><label for=\"fPhone\">Телефон</label><input id=\"fPhone\" name=\"phone\" type=\"tel\" autocomplete=\"tel\" inputmode=\"tel\" placeholder=\"08X XXX XXXX\" maxlength=\"20\" required></div>\n            <div class=\"field full\"><label for=\"fNote\">Бележка (по желание)</label><textarea id=\"fNote\" name=\"note\" maxlength=\"300\" placeholder=\"Напр. желан стил на подстрижка\"></textarea></div>\n            <div class=\"hp\" aria-hidden=\"true\"><label>Website<input name=\"website\" tabindex=\"-1\" autocomplete=\"off\"></label></div>\n          </div>\n        </div>\n        <div class=\"summary\">\n          <p id=\"summaryText\">Изберете услуга, ден и час.</p>\n          <button type=\"submit\" class=\"btn btn-gold\" id=\"submitBtn\" disabled>Потвърди резервацията</button>\n        </div>\n        <div class=\"error\" id=\"err\" role=\"alert\"></div>\n      </form>\n    </div>\n  </div>\n</section>\n\n<section id=\"vaprosi\" data-if-faq>\n  <div class=\"wrap\">\n    <div class=\"reveal\" style=\"text-align:center;margin-bottom:40px\">\n      <div class=\"eyebrow\">Въпроси</div>\n      <h2 class=\"title\">Често задавани <span class=\"gold-text\">въпроси</span></h2>\n    </div>\n    <div class=\"faq reveal\" id=\"faq\"></div>\n  </div>\n</section>\n\n<section id=\"kontakt\" class=\"contact\">\n  <div class=\"wrap\">\n    <div class=\"sec-head reveal\">\n      <div>\n        <div class=\"eyebrow\">Контакт</div>\n        <h2 class=\"title\">Очакваме ви в <span class=\"gold-text\">{{city}}</span></h2>\n      </div>\n    </div>\n    <div class=\"contact-grid\">\n      <div class=\"c-card reveal\">\n        <div class=\"c-item\"><div class=\"ic\"><svg><use href=\"#i-pin\"/></svg></div><div><small>Адрес</small><span>{{address}}</span>\n          <div class=\"map-btns\" id=\"mapBtns\"></div></div></div>\n        <div class=\"c-item\"><div class=\"ic\"><svg><use href=\"#i-phone\"/></svg></div><div><small>Телефон</small><a href=\"tel:{{phone}}\">{{phoneDisplay}}</a></div></div>\n        <div class=\"c-item\"><div class=\"ic\"><svg><use href=\"#i-clock\"/></svg></div><div style=\"flex:1\"><small>Работно време</small><table class=\"hours\" id=\"hoursTable\"></table></div></div>\n        <div class=\"socials\" id=\"socials\"></div>\n      </div>\n      <div class=\"map reveal\" id=\"mapBox\">\n        <iframe id=\"mapFrame\" title=\"Карта — {{name}}\" loading=\"lazy\" referrerpolicy=\"no-referrer-when-downgrade\"></iframe>\n      </div>\n    </div>\n  </div>\n</section>\n</main>\n\n<footer>\n  <div class=\"wrap\">\n    <div class=\"brand\"><span class=\"brand-logo\" data-logo></span><span><b>{{shortName}}</b><small>{{subName}}</small></span></div>\n    <div>© <span id=\"year\"></span> {{name}} · {{city}}</div>\n  </div>\n</footer>\n\n<div class=\"mbar\">\n  <a href=\"#rezervacia\" class=\"btn btn-gold\"><svg><use href=\"#i-cal\"/></svg>Запази час</a>\n  <a href=\"tel:{{phone}}\" class=\"btn btn-ghost call\" aria-label=\"Обади се\"><svg><use href=\"#i-phone\"/></svg></a>\n</div>\n\n<script>window.SITE = \"__SITE__\";</script>\n<script type=\"module\">\nimport {\n  WEEKDAYS, WEEKDAYS_SHORT, MONTHS_SHORT, nowInZone, bookableDates, availableStarts,\n  weekday, formatDateBG, phoneDisplay, priceText, durText,\n} from \"/booking.js\";\n\nconst C = window.SITE;\nconst $ = (s, r = document) => r.querySelector(s);\nconst esc = (s) => String(s ?? \"\").replace(/[&<>\"']/g, (c) => ({ \"&\": \"&amp;\", \"<\": \"&lt;\", \">\": \"&gt;\", '\"': \"&quot;\", \"'\": \"&#39;\" }[c]));\nconst media = (n) => `/media/${n}?v=${C.mediaVersion || 1}`;\nconst icon = (n) => `<svg><use href=\"#i-${esc(n)}\"/></svg>`;\nconst telHref = `tel:${String(C.phone || \"\").replace(/[^\\d+]/g, \"\")}`;\nconst phoneTxt = phoneDisplay(C.phone);\nconst services = C.services || [];\nconst offer = C.offer || {};\nconst offerOn = !!(offer.enabled && offer.title);\nconst gallery = C.gallery || [];\nconst faq = C.faq || [];\n\nconst toggle = (attr, on) => document.querySelectorAll(`[${attr}]`).forEach((el) => { el.hidden = !on; });\ntoggle(\"data-if-offer\", offerOn);\ntoggle(\"data-if-gallery\", gallery.length > 0);\ntoggle(\"data-if-faq\", faq.length > 0);\n\n/* ---------- Logo ---------- */\nconst letter = esc((C.shortName || C.name || \"B\").trim()[0] || \"B\");\ndocument.querySelectorAll(\"[data-logo]\").forEach((el) => {\n  el.innerHTML = C.logo\n    ? `<img src=\"${media(C.logo)}\" alt=\"${esc(C.name)} лого\" width=\"42\" height=\"42\">`\n    : `<span class=\"mono\">${letter}</span>`;\n});\n$(\"#emblemCenter\").innerHTML = C.logo\n  ? `<img class=\"disc\" src=\"${media(C.logo)}\" alt=\"\">`\n  : `<div class=\"disc-mono\">${letter}</div>`;\n\n/* ---------- Hero ---------- */\nconst badges = C.badges || [];\n[[\"#badge1\", badges[0], \"scissors\"], [\"#badge2\", badges[1], \"crown\"]].forEach(([sel, b, ic]) => {\n  const el = $(sel);\n  if (b && b.title) el.innerHTML = `${icon(ic)}<span><b>${esc(b.title)}</b><br>${esc(b.text)}</span>`;\n  else el.remove();\n});\nconst priced = [...services.filter((s) => s.featured), ...services.filter((s) => !s.featured)].filter((s) => s.price != null).slice(0, 2);\n$(\"#heroMeta\").innerHTML = priced.map((s) => `<div><strong>${esc(s.price)} €</strong>${esc(s.name.toLowerCase())}</div>`).join(\"\")\n  + `<div><strong>24/7</strong>онлайн резервация</div>`;\n\nconst marq = C.marquee || [];\nif (marq.length) {\n  const row = marq.map((m) => `<span>${esc(m)}</span>`).join(\"\");\n  $(\"#marquee\").innerHTML = row + row + row;\n} else $(\"#strip\").remove();\n\n/* ---------- Services ---------- */\n$(\"#servicesGrid\").innerHTML = services.map((s) => `\n  <article class=\"svc reveal ${s.featured ? \"featured\" : \"\"}\">\n    ${offerOn && offer.serviceId === s.id ? '<span class=\"flag\">Топ оферта</span>' : \"\"}\n    <div class=\"ic\">${icon(s.icon || \"scissors\")}</div>\n    <h3>${esc(s.name)}</h3>\n    <p>${esc(s.desc)}</p>\n    <div class=\"row\">\n      <div><div class=\"price ${s.price == null ? \"ask\" : \"\"}\">${priceText(s.price)}</div><div class=\"dur\">${durText(s.duration)}</div></div>\n      <a href=\"#rezervacia\" class=\"pick\" data-pick=\"${esc(s.id)}\">Запази <svg width=\"16\" height=\"16\"><use href=\"#i-arrow\"/></svg></a>\n    </div>\n  </article>`).join(\"\");\n\n/* ---------- Offer ---------- */\nif (offerOn) {\n  $(\"#offerEyebrow\").textContent = offer.eyebrow || \"Топ оферта\";\n  $(\"#offerTitle\").textContent = offer.title;\n  $(\"#offerPrice\").innerHTML = offer.price != null\n    ? `${esc(offer.price)}€ <small style=\"-webkit-text-fill-color:var(--muted)\">${esc(offer.priceNote)}</small>` : \"\";\n  $(\"#offerItems\").innerHTML = (offer.items || []).map((x) => `<div>${esc(x)}</div>`).join(\"\");\n  const target = services.find((s) => s.id === offer.serviceId);\n  if (target) $(\"#offerBtn\").dataset.pick = target.id;\n  const minis = services.filter((s) => s.featured && s.id !== offer.serviceId).slice(0, 2).map((s) => `\n    <div class=\"mini\"><div class=\"ic\">${icon(s.icon)}</div><div><h4>${esc(s.name)}</h4><p>${esc(s.desc)}</p></div>${s.price != null ? `<div class=\"p\">${esc(s.price)}€</div>` : \"\"}</div>`);\n  const hl = (C.highlights || []).map((h) => `\n    <div class=\"mini\"><div class=\"ic\">${icon(h.icon)}</div><div><h4>${esc(h.title)}</h4><p>${esc(h.text)}</p></div></div>`);\n  const right = [...minis, ...hl].slice(0, 4);\n  if (right.length) $(\"#offerRight\").innerHTML = right.join(\"\");\n  else { $(\"#offerRight\").remove(); $(\".offer-card\").style.gridTemplateColumns = \"1fr\"; }\n}\n\n/* ---------- Gallery ---------- */\nif (gallery.length) {\n  $(\"#gallery\").innerHTML = gallery.map((g, i) => `<figure><img src=\"${media(g)}\" alt=\"${esc(C.name)} — снимка ${i + 1}\" loading=\"lazy\"></figure>`).join(\"\");\n  if (C.instagram) {\n    $(\"#gallery\").insertAdjacentHTML(\"afterend\", `<div class=\"gallery-cta reveal\"><a href=\"${esc(C.instagram)}\" target=\"_blank\" rel=\"noopener\" class=\"btn btn-ghost\">${icon(\"ig\")}Instagram</a></div>`);\n  }\n}\n\n/* ---------- SSS ---------- */\n$(\"#faq\").innerHTML = faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join(\"\");\n\n/* ---------- Contact ---------- */\nconst hasGeo = C.lat != null && C.lng != null;\nconst btns = [];\nif (hasGeo) btns.push(`<a class=\"btn btn-gold\" target=\"_blank\" rel=\"noopener\" href=\"https://www.google.com/maps/dir/?api=1&destination=${C.lat},${C.lng}\">${icon(\"pin\")}Упътване</a>`);\nif (C.mapsUrl) btns.push(`<a class=\"btn btn-ghost\" target=\"_blank\" rel=\"noopener\" href=\"${esc(C.mapsUrl)}\">Google Maps</a>`);\n$(\"#mapBtns\").innerHTML = btns.join(\"\");\nif (hasGeo) $(\"#mapFrame\").src = `https://maps.google.com/maps?q=${C.lat},${C.lng}&z=17&hl=bg&output=embed`;\nelse if (C.address) $(\"#mapFrame\").src = `https://maps.google.com/maps?q=${encodeURIComponent(C.address)}&z=16&hl=bg&output=embed`;\nelse $(\"#mapBox\").remove();\n\nconst todayDow = weekday(nowInZone(C.timeZone).date);\n$(\"#hoursTable\").innerHTML = [1, 2, 3, 4, 5, 6, 0].map((d) => {\n  const h = C.hours && C.hours[d];\n  return `<tr class=\"${d === todayDow ? \"today\" : \"\"}\"><td>${WEEKDAYS[d]}</td><td>${h ? `${h[0]} – ${h[1]}` : \"Почивен ден\"}</td></tr>`;\n}).join(\"\");\n$(\"#socials\").innerHTML = [\n  C.instagram && `<a href=\"${esc(C.instagram)}\" target=\"_blank\" rel=\"noopener\" aria-label=\"Instagram\">${icon(\"ig\")}</a>`,\n  C.facebook && `<a href=\"${esc(C.facebook)}\" target=\"_blank\" rel=\"noopener\" aria-label=\"Facebook\">${icon(\"fb\")}</a>`,\n  C.tiktok && `<a href=\"${esc(C.tiktok)}\" target=\"_blank\" rel=\"noopener\" aria-label=\"TikTok\">${icon(\"tt\")}</a>`,\n  `<a href=\"${telHref}\" aria-label=\"Обади се\">${icon(\"phone\")}</a>`,\n].filter(Boolean).join(\"\");\n$(\"#year\").textContent = new Date().getFullYear();\n\n/* ---------- Booking ---------- */\nconst state = { service: null, date: null, time: null, busy: {}, loading: false };\nconst svcPick = $(\"#svcPick\"), datesEl = $(\"#dates\"), timesEl = $(\"#times\");\n\nsvcPick.innerHTML = services.map((s) => `\n  <button type=\"button\" class=\"opt\" data-id=\"${esc(s.id)}\" aria-pressed=\"false\">\n    <b>${esc(s.name)}</b><small>${priceText(s.price)} · ${durText(s.duration)}</small>\n  </button>`).join(\"\");\n\nconst now0 = nowInZone(C.timeZone);\nconst dates = bookableDates(C, now0);\ndatesEl.innerHTML = dates.map((d) => {\n  const [, m, day] = d.split(\"-\").map(Number);\n  const lbl = d === now0.date ? \"Днес\" : WEEKDAYS_SHORT[weekday(d)];\n  return `<button type=\"button\" class=\"date\" data-date=\"${d}\" aria-pressed=\"false\"><small>${lbl}</small><b>${day}</b><em>${MONTHS_SHORT[m - 1]}</em></button>`;\n}).join(\"\") || `<div class=\"hint\">Няма свободни дни в момента.</div>`;\n\nfunction setPressed(container, attr, value) {\n  container.querySelectorAll(`[${attr}]`).forEach((b) => b.setAttribute(\"aria-pressed\", String(b.getAttribute(attr) === value)));\n}\n\nfunction selectService(id) {\n  state.service = services.find((s) => s.id === id) || null;\n  if (!state.service) return;\n  setPressed(svcPick, \"data-id\", id);\n  $(\"#svcLabel\").textContent = state.service.name;\n  state.time = null;\n  const fits = (d) => availableStarts(C, d, state.service.duration, []).length > 0;\n  if (!state.date || !fits(state.date)) {\n    const d = dates.find(fits);\n    if (d) return selectDate(d, true);\n  }\n  renderTimes();\n}\n\nasync function selectDate(d, scroll = true) {\n  state.date = d; state.time = null;\n  setPressed(datesEl, \"data-date\", d);\n  $(\"#dateLabel\").textContent = formatDateBG(d);\n  if (scroll) datesEl.querySelector(`[data-date=\"${d}\"]`)?.scrollIntoView({ block: \"nearest\", inline: \"nearest\", behavior: \"smooth\" });\n  await loadBusy(d);\n  renderTimes();\n}\n\nasync function loadBusy(d, force = false) {\n  if (state.busy[d] && !force) return;\n  state.loading = true; renderTimes();\n  try {\n    const r = await fetch(`/api/slots?date=${d}`, { cache: \"no-store\" });\n    if (!r.ok) throw new Error();\n    state.busy[d] = (await r.json()).busy || [];\n  } catch { state.busy[d] = null; }\n  state.loading = false;\n}\n\nfunction renderTimes() {\n  if (!state.service || !state.date) {\n    timesEl.innerHTML = `<div class=\"hint\">Първо изберете услуга и ден.</div>`;\n  } else if (state.loading) {\n    timesEl.innerHTML = Array(8).fill('<div class=\"skeleton\"></div>').join(\"\");\n  } else if (state.busy[state.date] === null) {\n    timesEl.innerHTML = `<div class=\"hint\">Не успяхме да заредим свободните часове. Обадете се на <a href=\"${telHref}\" style=\"color:var(--gold2)\">${esc(phoneTxt)}</a> или <button type=\"button\" id=\"retry\" style=\"color:var(--gold2);text-decoration:underline\">опитайте отново</button>.</div>`;\n    $(\"#retry\").onclick = async () => { await loadBusy(state.date, true); renderTimes(); };\n  } else {\n    const slots = availableStarts(C, state.date, state.service.duration, state.busy[state.date]);\n    timesEl.innerHTML = slots.length\n      ? slots.map((t) => `<button type=\"button\" class=\"time\" data-time=\"${t}\" aria-pressed=\"${t === state.time}\">${t}</button>`).join(\"\")\n      : `<div class=\"hint\">Няма свободни часове за този ден. Изберете друг ден.</div>`;\n  }\n  $(\"#timeLabel\").textContent = state.time || \"\";\n  updateSummary();\n}\n\nfunction updateSummary() {\n  const ok = state.service && state.date && state.time;\n  $(\"#submitBtn\").disabled = !ok;\n  $(\"#summaryText\").innerHTML = ok\n    ? `<b>${esc(state.service.name)}</b> · ${formatDateBG(state.date)} · <b>${state.time}</b>`\n    : \"Изберете услуга, ден и час.\";\n}\n\nsvcPick.addEventListener(\"click\", (e) => { const b = e.target.closest(\".opt\"); if (b) selectService(b.dataset.id); });\ndatesEl.addEventListener(\"click\", (e) => { const b = e.target.closest(\".date\"); if (b) selectDate(b.dataset.date); });\ntimesEl.addEventListener(\"click\", (e) => {\n  const b = e.target.closest(\".time\"); if (!b) return;\n  state.time = b.dataset.time; setPressed(timesEl, \"data-time\", state.time);\n  $(\"#timeLabel\").textContent = state.time; updateSummary();\n});\ndocument.addEventListener(\"click\", (e) => { const a = e.target.closest(\"[data-pick]\"); if (a) selectService(a.dataset.pick); });\n\n$(\"#bookForm\").addEventListener(\"submit\", async (e) => {\n  e.preventDefault();\n  const err = $(\"#err\"); err.textContent = \"\";\n  const f = e.target;\n  const name = f.name.value.trim(), phone = f.phone.value.trim();\n  if (name.length < 2) { err.textContent = \"Моля, въведете вашето име.\"; f.name.focus(); return; }\n  if (phone.replace(/\\D/g, \"\").length < 7) { err.textContent = \"Моля, въведете валиден телефон.\"; f.phone.focus(); return; }\n  const btn = $(\"#submitBtn\"); btn.disabled = true; btn.textContent = \"Изпращане…\";\n  try {\n    const r = await fetch(\"/api/book\", {\n      method: \"POST\", headers: { \"content-type\": \"application/json\" },\n      body: JSON.stringify({ service: state.service.id, date: state.date, time: state.time, name, phone, note: f.note.value.trim(), website: f.website.value }),\n    });\n    const data = await r.json().catch(() => ({}));\n    if (!r.ok) {\n      err.textContent = data.error || \"Възникна грешка. Опитайте отново.\";\n      if (data.code === \"TAKEN\") { state.time = null; await loadBusy(state.date, true); renderTimes(); }\n      btn.textContent = \"Потвърди резервацията\"; updateSummary();\n      return;\n    }\n    showSuccess(name);\n  } catch {\n    err.textContent = `Няма връзка. Опитайте отново или се обадете на ${phoneTxt}.`;\n    btn.textContent = \"Потвърди резервацията\"; updateSummary();\n  }\n});\n\nfunction showSuccess(name) {\n  const panel = $(\"#panel\");\n  panel.innerHTML = `\n    <div class=\"success\">\n      <div class=\"check\"><svg><use href=\"#i-check\"/></svg></div>\n      <h3>Готово, ${esc(name.split(\" \")[0])}!</h3>\n      <p>Вашият час е запазен. Очакваме ви!</p>\n      <div class=\"when\"><b>${state.time} · ${formatDateBG(state.date)}</b>${esc(state.service.name)}</div>\n      <p>Ако се налага да отмените или преместите часа, обадете се на <a href=\"${telHref}\" style=\"color:var(--gold2)\">${esc(phoneTxt)}</a>.</p>\n      <p style=\"margin-top:24px\"><a href=\"#rezervacia\" onclick=\"location.reload()\" class=\"btn btn-ghost\">Нова резервация</a></p>\n    </div>`;\n  panel.scrollIntoView({ behavior: \"smooth\", block: \"center\" });\n}\n\n/* ---------- Navigation and animations ---------- */\nconst nav = $(\"#nav\");\nconst onScroll = () => nav.classList.toggle(\"scrolled\", scrollY > 20);\naddEventListener(\"scroll\", onScroll, { passive: true }); onScroll();\n$(\"#burger\").addEventListener(\"click\", () => {\n  const open = nav.classList.toggle(\"open\");\n  $(\"#burger\").setAttribute(\"aria-expanded\", String(open));\n});\n$(\"#navLinks\").addEventListener(\"click\", (e) => { if (e.target.closest(\"a\")) nav.classList.remove(\"open\"); });\nconst io = new IntersectionObserver((entries) => entries.forEach((en) => {\n  if (en.isIntersecting) { en.target.classList.add(\"in\"); io.unobserve(en.target); }\n}), { threshold: 0.12 });\ndocument.querySelectorAll(\".reveal\").forEach((el) => io.observe(el));\n</script>\n</body>\n</html>\n"},"/admin.html":{"t":"text/html; charset=utf-8","s":"<!doctype html>\n<html lang=\"bg\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<meta name=\"robots\" content=\"noindex, nofollow\">\n<title>Админ панел</title>\n<link href=\"https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=Manrope:wght@400;600;700&display=swap\" rel=\"stylesheet\">\n<style>\n:root{--bg:#0b0b0d;--card:#17171c;--card2:#1d1d23;--line:rgba(255,255,255,.08);--text:#ece9e2;--muted:#9d9a93;--gold:#c9a45c;--gold2:#e8cf8f;--red:#ff8f7a;--green:#7ad69a}\n*{box-sizing:border-box;margin:0;padding:0}\nbody{background:var(--bg);color:var(--text);font-family:Manrope,system-ui,sans-serif;min-height:100vh}\n.wrap{max-width:820px;margin:0 auto;padding:20px 16px 120px}\nheader{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px;flex-wrap:wrap}\nheader .b{display:flex;align-items:center;gap:12px;min-width:0}\nheader .b img,header .b .mono{width:44px;height:44px;border-radius:50%;flex:none}\nheader .b .mono{display:grid;place-items:center;background:rgba(201,164,92,.15);color:var(--gold2);font-family:\"Playfair Display\",serif;font-size:1.3rem}\nheader h1{font-family:\"Playfair Display\",serif;font-size:1.35rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\nheader .btn{white-space:nowrap}\nbutton,input,select,textarea{font:inherit}\n.btn{padding:11px 18px;border-radius:12px;border:1px solid var(--line);background:none;color:var(--text);cursor:pointer;font-weight:600}\n.btn:hover{border-color:rgba(201,164,92,.5)}\n.btn.gold{background:var(--gold);color:#16130c;border-color:var(--gold)}\n.btn.sm{padding:7px 12px;font-size:.85rem;border-radius:10px}\n.btn.danger{color:var(--red)}\n.btn[disabled]{opacity:.5;cursor:not-allowed}\n.tabs{display:flex;gap:6px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:5px;margin-bottom:22px}\n.tabs button{flex:1;padding:11px;border:0;border-radius:10px;background:none;color:var(--muted);font-weight:700;cursor:pointer}\n.tabs button.on{background:var(--gold);color:#16130c}\n.login{max-width:360px;margin:12vh auto;background:var(--card);border:1px solid var(--line);border-radius:20px;padding:30px;text-align:center}\n.login input{width:100%;padding:14px;border-radius:12px;border:1px solid var(--line);background:#0f0f13;color:var(--text);margin:18px 0 12px;font-size:16px}\n.err{color:var(--red);font-size:.9rem;min-height:1.2em;margin-top:8px}\n.ok{color:var(--green)}\n.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:24px}\n.stat{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px}\n.stat b{display:block;font-family:\"Playfair Display\",serif;font-size:1.7rem;color:var(--gold2)}\n.stat span{font-size:.78rem;color:var(--muted)}\n.day{margin-bottom:22px}\n.day h2{font-size:.8rem;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin-bottom:10px;font-weight:700}\n.bk{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px;display:grid;grid-template-columns:70px 1fr auto;gap:12px;align-items:center;margin-bottom:8px}\n.bk .t{font-family:\"Playfair Display\",serif;font-size:1.35rem}\n.bk .t small{display:block;font-family:Manrope;font-size:.72rem;color:var(--muted)}\n.bk .n{font-weight:700}\n.bk .s{font-size:.85rem;color:var(--muted)}\n.bk .note{font-size:.82rem;color:#cfcbc2;margin-top:4px}\n.bk .acts{display:flex;gap:6px}\n.bk .acts a,.bk .acts button{width:40px;height:40px;border-radius:10px;border:1px solid var(--line);display:grid;place-items:center;color:var(--text);background:none;cursor:pointer;text-decoration:none}\n.bk.past{opacity:.5}\n.bk.block{background:repeating-linear-gradient(135deg,#16161b 0 10px,#1a1a20 10px 20px)}\n.bk.block .n{color:var(--muted)}\n.tag{display:inline-block;font-size:.68rem;font-weight:700;padding:2px 8px;border-radius:99px;margin-left:6px;vertical-align:middle;background:rgba(201,164,92,.15);color:var(--gold2)}\n.empty{text-align:center;color:var(--muted);padding:60px 0}\n.card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:20px;margin-bottom:16px}\n.card h3{font-family:\"Playfair Display\",serif;font-size:1.2rem;margin-bottom:4px}\n.card .sub{color:var(--muted);font-size:.85rem;margin-bottom:16px}\n.add{border-color:rgba(201,164,92,.35);display:none}\n.add.open{display:block}\n.seg{display:flex;background:#0f0f13;border:1px solid var(--line);border-radius:12px;padding:4px;margin-bottom:14px}\n.seg button{flex:1;padding:10px;border:0;border-radius:9px;background:none;color:var(--muted);font-weight:700;cursor:pointer}\n.seg button.on{background:var(--gold);color:#16130c}\n.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}\n.grid .full{grid-column:1/-1}\nlabel.l{display:block;font-size:.75rem;color:var(--muted);font-weight:600;margin-bottom:5px}\n.grid input,.grid select,.grid textarea,.row-item input,.row-item select,.row-item textarea{width:100%;padding:11px 12px;border-radius:11px;border:1px solid var(--line);background:#0f0f13;color:var(--text);font-size:16px;color-scheme:dark}\ntextarea{resize:vertical;min-height:70px}\ninput:focus,select:focus,textarea:focus{outline:none;border-color:var(--gold)}\n.hint{font-size:.78rem;color:var(--muted);margin-top:5px}\n.actions{display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap}\n.row-item{background:var(--card2);border:1px solid var(--line);border-radius:14px;padding:14px;margin-bottom:10px}\n.row-item .top{display:flex;gap:8px;align-items:center;margin-bottom:10px}\n.row-item .top b{flex:1;font-size:.85rem;color:var(--gold2)}\n.row-item .g{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:8px}\n.row-item .g .full{grid-column:1/-1}\n.check{display:flex;align-items:center;gap:8px;font-size:.9rem;cursor:pointer}\n.check input{width:18px;height:18px;accent-color:var(--gold)}\n.hours-row{display:grid;grid-template-columns:110px 90px 1fr 1fr;gap:8px;align-items:center;margin-bottom:8px}\n.hours-row input[type=time]{width:100%;padding:9px 10px;border-radius:11px;border:1px solid var(--line);background:#0f0f13;color:var(--text);font-size:16px;color-scheme:dark}\n.hours-row input[type=time]:disabled{opacity:.35}\n.color{display:flex;gap:8px}\n.color input[type=color]{width:52px;height:46px;padding:4px;border-radius:11px;border:1px solid var(--line);background:#0f0f13;flex:none}\n.media{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}\n.slot{aspect-ratio:1;border-radius:14px;border:1px dashed rgba(255,255,255,.18);position:relative;overflow:hidden;display:grid;place-items:center;color:var(--muted);font-size:.8rem;cursor:pointer;background:#0f0f13;text-align:center;padding:6px}\n.slot img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}\n.slot .x{position:absolute;top:6px;right:6px;width:30px;height:30px;border-radius:50%;background:rgba(0,0,0,.7);border:0;color:#fff;cursor:pointer;z-index:2}\n.slot.busy::after{content:\"…\";position:absolute;inset:0;display:grid;place-items:center;background:rgba(0,0,0,.6);color:#fff;font-size:1.6rem}\n.logo-row{display:flex;gap:16px;align-items:center}\n.logo-row .slot{width:110px;flex:none}\n.savebar{position:fixed;left:0;right:0;bottom:0;background:rgba(11,11,13,.94);backdrop-filter:blur(10px);border-top:1px solid var(--line);padding:12px 16px;z-index:20}\n.savebar .in{max-width:820px;margin:0 auto;display:flex;gap:12px;align-items:center;justify-content:space-between}\n.savebar .msg{font-size:.88rem;color:var(--muted)}\n.savebar .btn{min-width:160px}\n@media(max-width:600px){\n  .grid{grid-template-columns:1fr}\n  .row-item .g{grid-template-columns:1fr 1fr}\n  .row-item .g .wide{grid-column:1/-1}\n  .media{grid-template-columns:repeat(3,1fr)}\n  .hours-row{grid-template-columns:1fr 1fr;row-gap:6px}\n  .hours-row .dname{font-weight:700}\n  .bk{grid-template-columns:58px 1fr}.bk .acts{grid-column:1/-1;justify-content:flex-end}\n  header>div:last-child{width:100%;display:flex;gap:8px}header>div:last-child .btn{flex:1}\n}\n</style>\n</head>\n<body>\n<div class=\"wrap\" id=\"app\"></div>\n\n<script type=\"module\">\nimport { WEEKDAYS, formatDateBG, nowInZone, toMin, fromMin, addDays, overlapCount } from \"/booking.js\";\n\nconst app = document.getElementById(\"app\");\nconst esc = (s) => String(s ?? \"\").replace(/[&<>\"']/g, (c) => ({ \"&\": \"&amp;\", \"<\": \"&lt;\", \">\": \"&gt;\", '\"': \"&quot;\", \"'\": \"&#39;\" }[c]));\nconst ICONS = { scissors: \"Ножици\", beard: \"Брада\", crown: \"Корона\", curl: \"Къдрици\", razor: \"Бръснач\", star: \"Звезда\", coffee: \"Кафе\", clock: \"Часовник\", card: \"Карта\", child: \"Дете\" };\nlet key = \"\";\ntry { key = sessionStorage.getItem(\"bb_admin\") || \"\"; } catch {}\nlet S = null;          // settings\nlet tab = \"bookings\";\nlet addOpen = false, addType = \"phone\";\nlet dirty = false;\n\n/* ======================= API ======================= */\nasync function api(method, path, body, headers = {}) {\n  const opts = { method, headers: { \"x-admin-key\": key, ...headers } };\n  if (body !== undefined) {\n    if (body instanceof Blob) opts.body = body;\n    else { opts.body = JSON.stringify(body); opts.headers[\"content-type\"] = \"application/json\"; }\n  }\n  const r = await fetch(path, opts);\n  const data = await r.json().catch(() => ({}));\n  if (r.status === 401) throw Object.assign(new Error(data.error || \"Грешна парола.\"), { auth: true });\n  if (!r.ok) throw new Error(data.error || \"Грешка\");\n  return data;\n}\n\nfunction loginView(msg = \"\") {\n  app.innerHTML = `\n    <form class=\"login\" id=\"lf\">\n      <h1 style=\"font-family:'Playfair Display',serif\">Админ панел</h1>\n      <input type=\"password\" id=\"pw\" placeholder=\"Парола\" autocomplete=\"current-password\" required>\n      <button class=\"btn gold\" style=\"width:100%\">Вход</button>\n      <div class=\"err\">${esc(msg)}</div>\n    </form>`;\n  document.getElementById(\"lf\").onsubmit = (e) => {\n    e.preventDefault();\n    key = document.getElementById(\"pw\").value;\n    try { sessionStorage.setItem(\"bb_admin\", key); } catch {}\n    start();\n  };\n}\n\nasync function start() {\n  if (!key) return loginView();\n  try { S = await api(\"GET\", \"/api/admin/settings\"); }\n  catch (e) {\n    if (e.auth) { try { sessionStorage.removeItem(\"bb_admin\"); } catch {} key = \"\"; return loginView(\"Грешна парола.\"); }\n    return (app.innerHTML = `<p class=\"empty\">${esc(e.message)}</p>`);\n  }\n  render();\n}\n\nfunction shell(inner) {\n  const logo = S.logo ? `<img src=\"/media/${S.logo}?v=${S.mediaVersion || 1}\" alt=\"\">` : `<span class=\"mono\">${esc((S.shortName || S.name || \"B\")[0])}</span>`;\n  document.title = `Админ — ${S.name}`;\n  return `\n    <header>\n      <div class=\"b\">${logo}<h1>${esc(S.name)}</h1></div>\n      <div><a class=\"btn\" href=\"/\" target=\"_blank\">Сайт ↗</a> <button class=\"btn\" id=\"lo\">Изход</button></div>\n    </header>\n    <div class=\"tabs\">\n      <button data-tab=\"bookings\" class=\"${tab === \"bookings\" ? \"on\" : \"\"}\">📅 Резервации</button>\n      <button data-tab=\"settings\" class=\"${tab === \"settings\" ? \"on\" : \"\"}\">⚙️ Настройки</button>\n    </div>\n    ${inner}`;\n}\n\nfunction bindShell() {\n  document.getElementById(\"lo\").onclick = () => { try { sessionStorage.removeItem(\"bb_admin\"); } catch {} key = \"\"; loginView(); };\n  app.querySelectorAll(\"[data-tab]\").forEach((b) => b.onclick = () => {\n    if (tab === \"settings\" && dirty && !confirm(\"Имате незапазени промени. Да продължа ли без запис?\")) return;\n    if (tab === \"settings\" && dirty) { dirty = false; start(); tab = b.dataset.tab; return; }\n    tab = b.dataset.tab; render();\n  });\n}\n\nfunction render() {\n  if (tab === \"bookings\") return bookingsView();\n  return settingsView();\n}\n\n/* ======================= BOOKINGS ======================= */\nconst svcName = (id) => (S.services || []).find((s) => s.id === id)?.name || id;\n\nasync function bookingsView() {\n  const now = nowInZone(S.timeZone);\n  let data;\n  try { data = await api(\"GET\", `/api/admin?from=${now.date}&days=60`); }\n  catch (e) {\n    if (e.auth) return loginView(\"Грешна парола.\");\n    app.innerHTML = shell(`<p class=\"empty\">${esc(e.message)}</p>`); bindShell(); return;\n  }\n  const all = data.days.flatMap((d) => d.bookings).filter((b) => b.service !== \"block\");\n  const today = (data.days.find((d) => d.date === now.date)?.bookings || []).filter((b) => b.service !== \"block\").length;\n  const week = data.days.filter((d) => d.date <= addDays(now.date, 6)).flatMap((d) => d.bookings).filter((b) => b.service !== \"block\").length;\n\n  app.innerHTML = shell(`\n    <div style=\"display:flex;gap:8px;margin-bottom:16px\">\n      <button class=\"btn gold\" id=\"addBtn\" style=\"flex:1\">+ Добави резервация / блокирай час</button>\n      <button class=\"btn\" id=\"rf\" title=\"Обнови\">↻</button>\n    </div>\n    <form class=\"card add ${addOpen ? \"open\" : \"\"}\" id=\"addForm\">\n      <div class=\"seg\"><button type=\"button\" data-type=\"phone\" class=\"${addType === \"phone\" ? \"on\" : \"\"}\">📞 По телефон</button><button type=\"button\" data-type=\"block\" class=\"${addType === \"block\" ? \"on\" : \"\"}\">⛔ Блокирай час</button></div>\n      <div class=\"grid\">\n        <div class=\"full\" data-only=\"phone\"><label class=\"l\">Услуга</label><select id=\"aSvc\">${(S.services || []).map((x) => `<option value=\"${esc(x.id)}\">${esc(x.name)} · ${x.duration} мин</option>`).join(\"\")}</select></div>\n        <div class=\"full\" data-only=\"block\"><label class=\"l\">Продължителност</label><select id=\"aDur\">${[30, 60, 90, 120, 180, 240, 300, 360, 480, 600].map((m) => `<option value=\"${m}\">${m < 60 ? m + \" мин\" : (m / 60) + \" ч\"}</option>`).join(\"\")}</select></div>\n        <div><label class=\"l\">Дата</label><input type=\"date\" id=\"aDate\" min=\"${now.date}\" value=\"${now.date}\"></div>\n        <div><label class=\"l\">Час</label><select id=\"aTime\"></select></div>\n        <div data-only=\"phone\"><label class=\"l\">Име на клиента</label><input id=\"aName\" maxlength=\"60\" placeholder=\"Име\"></div>\n        <div data-only=\"phone\"><label class=\"l\">Телефон (по желание)</label><input id=\"aPhone\" type=\"tel\" maxlength=\"20\" placeholder=\"08X XXX XXXX\"></div>\n        <div class=\"full\"><label class=\"l\">Бележка (по желание)</label><input id=\"aNote\" maxlength=\"300\"></div>\n      </div>\n      <div class=\"err\" id=\"aErr\"></div>\n      <div class=\"actions\"><button type=\"button\" class=\"btn\" id=\"aCancel\">Отказ</button><button class=\"btn gold\" id=\"aSave\">Запази</button></div>\n    </form>\n    <div class=\"stats\">\n      <div class=\"stat\"><b>${today}</b><span>днес</span></div>\n      <div class=\"stat\"><b>${week}</b><span>следващите 7 дни</span></div>\n      <div class=\"stat\"><b>${all.length}</b><span>общо (60 дни)</span></div>\n    </div>\n    ${data.days.length ? data.days.map((d) => `\n      <div class=\"day\">\n        <h2>${d.date === now.date ? \"Днес · \" : \"\"}${formatDateBG(d.date)}</h2>\n        ${d.bookings.map((b) => {\n          const past = d.date === now.date && toMin(b.time) + b.duration < now.minutes;\n          const block = b.service === \"block\";\n          const tagTxt = b.source === \"phone\" ? \"по телефон\" : b.source === \"online\" ? \"онлайн\" : \"\";\n          return `\n          <div class=\"bk ${past ? \"past\" : \"\"} ${block ? \"block\" : \"\"}\">\n            <div class=\"t\">${esc(b.time)}<small>${b.duration} мин</small></div>\n            <div>\n              <div class=\"n\">${block ? \"⛔ \" : \"\"}${esc(b.name)}${tagTxt ? `<span class=\"tag\">${tagTxt}</span>` : \"\"}</div>\n              <div class=\"s\">${block ? `Блокиран · до ${fromMin(toMin(b.time) + b.duration)}` : esc(svcName(b.service)) + (b.phone ? \" · \" + esc(b.phone) : \"\")}</div>\n              ${b.note ? `<div class=\"note\">📝 ${esc(b.note)}</div>` : \"\"}\n            </div>\n            <div class=\"acts\">\n              ${b.phone ? `<a href=\"tel:${esc(String(b.phone).replace(/[^\\d+]/g, \"\"))}\" title=\"Обади се\">📞</a>` : \"\"}\n              <button data-del=\"${esc(b.id)}\" title=\"Отмени\">✕</button>\n            </div>\n          </div>`;\n        }).join(\"\")}\n      </div>`).join(\"\") : `<p class=\"empty\">Няма предстоящи резервации.</p>`}`);\n  bindShell();\n  document.getElementById(\"rf\").onclick = bookingsView;\n  app.querySelectorAll(\"[data-del]\").forEach((btn) => btn.onclick = async () => {\n    if (!confirm(\"Да се отмени ли тази резервация?\")) return;\n    try { await api(\"DELETE\", `/api/admin?id=${encodeURIComponent(btn.dataset.del)}`); bookingsView(); }\n    catch (e) { alert(e.message); }\n  });\n  setupAdd(now);\n}\n\nfunction setupAdd(now) {\n  const $ = (id) => document.getElementById(id);\n  const f = $(\"addForm\");\n  const applyType = () => {\n    f.querySelectorAll(\".seg button\").forEach((x) => x.classList.toggle(\"on\", x.dataset.type === addType));\n    f.querySelectorAll(\"[data-only]\").forEach((el) => el.hidden = el.dataset.only !== addType);\n    $(\"aNote\").placeholder = addType === \"block\" ? \"Напр. обедна почивка, отпуск\" : \"Напр. фейд, къса брада\";\n  };\n  applyType();\n  $(\"addBtn\").onclick = () => { addOpen = !addOpen; f.classList.toggle(\"open\", addOpen); if (addOpen) refreshTimes(); };\n  $(\"aCancel\").onclick = () => { addOpen = false; f.classList.remove(\"open\"); };\n  f.querySelectorAll(\".seg button\").forEach((b) => b.onclick = () => { addType = b.dataset.type; applyType(); refreshTimes(); });\n  [\"aSvc\", \"aDur\", \"aDate\"].forEach((id) => $(id).onchange = refreshTimes);\n\n  async function refreshTimes() {\n    const date = $(\"aDate\").value, sel = $(\"aTime\");\n    const dur = addType === \"block\" ? Number($(\"aDur\").value) : (S.services.find((x) => x.id === $(\"aSvc\").value) || {}).duration || 30;\n    const h = date && S.hours && S.hours[new Date(date + \"T12:00:00Z\").getUTCDay()];\n    if (!h || (S.closedDates || []).includes(date)) { sel.innerHTML = `<option value=\"\">Почивен ден</option>`; return; }\n    sel.innerHTML = `<option value=\"\">Зареждане…</option>`;\n    let busy = [];\n    try { busy = (await (await fetch(`/api/slots?date=${date}`, { cache: \"no-store\" })).json()).busy || []; } catch {}\n    const [o, c] = h.map(toMin), opts = [];\n    const nowCut = date === now.date ? nowInZone(S.timeZone).minutes - 30 : -1;\n    for (let t = o; t + dur <= c; t += S.slotStep) {\n      if (t < nowCut) continue;\n      const full = overlapCount(busy, t, dur) >= S.chairs;\n      opts.push(`<option value=\"${fromMin(t)}\" ${full ? \"disabled\" : \"\"}>${fromMin(t)}${full ? \" — зает\" : \"\"}</option>`);\n    }\n    sel.innerHTML = opts.join(\"\") || `<option value=\"\">Няма място</option>`;\n    const first = sel.querySelector(\"option:not([disabled])\"); if (first) sel.value = first.value;\n  }\n  if (addOpen) refreshTimes();\n\n  f.onsubmit = async (e) => {\n    e.preventDefault();\n    const err = $(\"aErr\"); err.textContent = \"\";\n    if (!$(\"aTime\").value) { err.textContent = \"Изберете свободен час.\"; return; }\n    const body = addType === \"block\"\n      ? { type: \"block\", date: $(\"aDate\").value, time: $(\"aTime\").value, duration: Number($(\"aDur\").value), name: $(\"aNote\").value || \"Блокиран час\" }\n      : { type: \"phone\", service: $(\"aSvc\").value, date: $(\"aDate\").value, time: $(\"aTime\").value, name: $(\"aName\").value, phone: $(\"aPhone\").value, note: $(\"aNote\").value };\n    if (body.type === \"phone\" && body.name.trim().length < 2) { err.textContent = \"Въведете име на клиента.\"; return; }\n    $(\"aSave\").disabled = true;\n    try { await api(\"POST\", \"/api/admin\", body); addOpen = false; bookingsView(); }\n    catch (e2) { err.textContent = e2.message; $(\"aSave\").disabled = false; refreshTimes(); }\n  };\n}\n\n/* ======================= SETTINGS ======================= */\nconst F = (k, label, opts = {}) => {\n  const v = S[k] ?? \"\";\n  const ph = opts.ph ? ` placeholder=\"${esc(opts.ph)}\"` : \"\";\n  const field = opts.area\n    ? `<textarea data-f=\"${k}\" maxlength=\"${opts.max || 300}\"${ph}>${esc(v)}</textarea>`\n    : `<input data-f=\"${k}\" value=\"${esc(v)}\" type=\"${opts.type || \"text\"}\" maxlength=\"${opts.max || 120}\"${ph}${opts.step ? ` step=\"${opts.step}\"` : \"\"}>`;\n  return `<div class=\"${opts.full ? \"full\" : \"\"}\"><label class=\"l\">${label}</label>${field}${opts.hint ? `<div class=\"hint\">${opts.hint}</div>` : \"\"}</div>`;\n};\nconst iconSelect = (val, attr) => `<select ${attr}>${Object.entries(ICONS).map(([k, n]) => `<option value=\"${k}\" ${k === val ? \"selected\" : \"\"}>${n}</option>`).join(\"\")}</select>`;\n\nfunction settingsView() {\n  const o = S.offer || {};\n  const badges = S.badges || [{}, {}];\n  app.innerHTML = shell(`\n    <div class=\"card\">\n      <h3>Бизнес</h3><div class=\"sub\">Основна информация, която се показва на сайта и в Google.</div>\n      <div class=\"grid\">\n        ${F(\"name\", \"Име на бизнеса\", { max: 80, ph: \"Barber Shop Example\" })}\n        ${F(\"city\", \"Град\", { max: 60, ph: \"Варна\" })}\n        ${F(\"shortName\", \"Кратко име (в менюто)\", { max: 30 })}\n        ${F(\"subName\", \"Подзаглавие под името\", { max: 40, ph: \"BARBER SHOP\" })}\n        ${F(\"phone\", \"Телефон\", { max: 20, ph: \"+359888123456\", type: \"tel\" })}\n        ${F(\"eyebrow\", \"Малък надпис над заглавието\", { max: 60, ph: \"Барбершоп · Варна\" })}\n        ${F(\"address\", \"Адрес\", { max: 160, full: true })}\n        ${F(\"instagram\", \"Instagram линк\", { max: 400, ph: \"https://www.instagram.com/...\" })}\n        ${F(\"facebook\", \"Facebook линк\", { max: 400, ph: \"https://www.facebook.com/...\" })}\n        ${F(\"tiktok\", \"TikTok линк\", { max: 400, ph: \"https://www.tiktok.com/@...\" })}\n        ${F(\"mapsUrl\", \"Google Maps линк\", { max: 400, ph: \"https://www.google.com/maps/place/...\", hint: \"Поставете пълния линк — координатите се попълват сами.\" })}\n        ${F(\"lat\", \"Географска ширина (lat)\", { type: \"number\", step: \"any\" })}\n        ${F(\"lng\", \"Географска дължина (lng)\", { type: \"number\", step: \"any\" })}\n      </div>\n    </div>\n\n    <div class=\"card\">\n      <h3>Външен вид</h3><div class=\"sub\">Лого, цветове и текстове в началото на сайта.</div>\n      <div class=\"logo-row\" style=\"margin-bottom:16px\">\n        ${slotHTML(\"logo\", S.logo ? \"logo\" : \"\", \"Качи лого\")}\n        <div class=\"hint\">Квадратно лого (PNG или JPG). Показва се в менюто, в центъра на началния екран и като икона на сайта.</div>\n      </div>\n      <div class=\"grid\">\n        <div><label class=\"l\">Основен цвят (бутони, акценти)</label><div class=\"color\"><input type=\"color\" data-color=\"accent\" value=\"${esc(S.accent)}\"><input data-f=\"accent\" value=\"${esc(S.accent)}\" maxlength=\"7\"></div></div>\n        <div><label class=\"l\">Фон (тъмен цвят)</label><div class=\"color\"><input type=\"color\" data-color=\"bg\" value=\"${esc(S.bg)}\"><input data-f=\"bg\" value=\"${esc(S.bg)}\" maxlength=\"7\"></div></div>\n        ${F(\"heroTitle1\", \"Голямо заглавие — ред 1\", { max: 30 })}\n        ${F(\"heroTitle2\", \"Голямо заглавие — ред 2 (в цвят)\", { max: 30 })}\n        ${F(\"tagline\", \"Слоган\", { max: 120, full: true })}\n        ${F(\"heroText\", \"Кратък текст под слогана\", { max: 300, full: true, area: true })}\n        <div><label class=\"l\">Значка 1 — заглавие</label><input data-badge=\"0.title\" value=\"${esc(badges[0]?.title)}\" maxlength=\"30\"></div>\n        <div><label class=\"l\">Значка 1 — текст</label><input data-badge=\"0.text\" value=\"${esc(badges[0]?.text)}\" maxlength=\"40\"></div>\n        <div><label class=\"l\">Значка 2 — заглавие</label><input data-badge=\"1.title\" value=\"${esc(badges[1]?.title)}\" maxlength=\"30\"></div>\n        <div><label class=\"l\">Значка 2 — текст</label><input data-badge=\"1.text\" value=\"${esc(badges[1]?.text)}\" maxlength=\"40\"></div>\n        <div class=\"full\"><label class=\"l\">Движеща се лента (думи, разделени със запетая)</label><input id=\"marqueeIn\" value=\"${esc((S.marquee || []).join(\", \"))}\"></div>\n      </div>\n    </div>\n\n    <div class=\"card\">\n      <h3>Услуги и цени</h3><div class=\"sub\">Празна цена = „по запитване“. Продължителността определя колко време заема часът.</div>\n      <div id=\"svcList\"></div>\n      <button class=\"btn sm\" id=\"svcAdd\">+ Добави услуга</button>\n    </div>\n\n    <div class=\"card\">\n      <h3>Оферта</h3><div class=\"sub\">Голям блок с промоция (напр. пакет на специална цена).</div>\n      <label class=\"check\" style=\"margin-bottom:14px\"><input type=\"checkbox\" id=\"offOn\" ${o.enabled ? \"checked\" : \"\"}> Покажи офертата на сайта</label>\n      <div class=\"grid\">\n        <div><label class=\"l\">Малък надпис</label><input id=\"offEyebrow\" value=\"${esc(o.eyebrow)}\" maxlength=\"40\" placeholder=\"Топ оферта\"></div>\n        <div><label class=\"l\">Заглавие</label><input id=\"offTitle\" value=\"${esc(o.title)}\" maxlength=\"80\" placeholder=\"Пълна грижа за теб\"></div>\n        <div><label class=\"l\">Цена (€)</label><input id=\"offPrice\" value=\"${esc(o.price ?? \"\")}\" inputmode=\"decimal\"></div>\n        <div><label class=\"l\">Текст до цената</label><input id=\"offNote\" value=\"${esc(o.priceNote)}\" maxlength=\"40\" placeholder=\"всичко това\"></div>\n        <div class=\"full\"><label class=\"l\">Какво включва (по един на ред)</label><textarea id=\"offItems\">${esc((o.items || []).join(\"\\n\"))}</textarea></div>\n        <div class=\"full\"><label class=\"l\">Бутонът „Запази“ избира услуга</label><select id=\"offSvc\"><option value=\"\">—</option>${(S.services || []).map((s) => `<option value=\"${esc(s.id)}\" ${s.id === o.serviceId ? \"selected\" : \"\"}>${esc(s.name)}</option>`).join(\"\")}</select></div>\n      </div>\n      <div style=\"margin-top:16px\"><label class=\"l\">Предимства до офертата (до 4)</label><div id=\"hlList\"></div><button class=\"btn sm\" id=\"hlAdd\">+ Добави предимство</button></div>\n    </div>\n\n    <div class=\"card\">\n      <h3>Галерия</h3><div class=\"sub\">До 8 снимки. Снимките се смаляват автоматично преди качване.</div>\n      <div class=\"media\">${[\"g1\", \"g2\", \"g3\", \"g4\", \"g5\", \"g6\", \"g7\", \"g8\"].map((g) => slotHTML(g, (S.gallery || []).includes(g) ? g : \"\", \"+ Снимка\")).join(\"\")}</div>\n    </div>\n\n    <div class=\"card\">\n      <h3>Работно време и резервации</h3><div class=\"sub\">Онлайн резервациите се правят само в тези часове.</div>\n      <div id=\"hoursBox\">${[1, 2, 3, 4, 5, 6, 0].map((d) => {\n        const h = S.hours && S.hours[d];\n        return `<div class=\"hours-row\"><span class=\"dname\">${WEEKDAYS[d]}</span>\n          <label class=\"check\"><input type=\"checkbox\" data-open=\"${d}\" ${h ? \"checked\" : \"\"}> отворено</label>\n          <input type=\"time\" data-from=\"${d}\" value=\"${h ? h[0] : \"09:00\"}\" ${h ? \"\" : \"disabled\"}>\n          <input type=\"time\" data-to=\"${d}\" value=\"${h ? h[1] : \"19:00\"}\" ${h ? \"\" : \"disabled\"}></div>`;\n      }).join(\"\")}</div>\n      <div class=\"grid\" style=\"margin-top:12px\">\n        <div><label class=\"l\">Бръснари (клиенти едновременно)</label><input type=\"number\" data-f=\"chairs\" min=\"1\" max=\"20\" value=\"${S.chairs}\"></div>\n        <div><label class=\"l\">Начало на часовете през</label><select data-f=\"slotStep\">${[10, 15, 20, 30, 45, 60].map((m) => `<option value=\"${m}\" ${m === S.slotStep ? \"selected\" : \"\"}>${m} мин</option>`).join(\"\")}</select></div>\n        <div><label class=\"l\">Мин. време предварително (мин)</label><input type=\"number\" data-f=\"minLeadMinutes\" min=\"0\" max=\"1440\" value=\"${S.minLeadMinutes}\"></div>\n        <div><label class=\"l\">Резервации до (дни напред)</label><input type=\"number\" data-f=\"maxDaysAhead\" min=\"1\" max=\"90\" value=\"${S.maxDaysAhead}\"></div>\n        <div class=\"full\"><label class=\"l\">Почивни дати (по една на ред, ГГГГ-ММ-ДД)</label><textarea id=\"closedIn\" placeholder=\"2026-12-25\">${esc((S.closedDates || []).join(\"\\n\"))}</textarea></div>\n      </div>\n    </div>\n\n    <div class=\"card\">\n      <h3>Често задавани въпроси</h3><div class=\"sub\">Показват се на сайта и помагат в Google търсенето.</div>\n      <div id=\"faqList\"></div>\n      <button class=\"btn sm\" id=\"faqAdd\">+ Добави въпрос</button>\n    </div>\n\n    <div class=\"card\">\n      <h3>SEO (Google)</h3><div class=\"sub\">Оставете празно за автоматичен текст.</div>\n      <div class=\"grid\">\n        ${F(\"seoTitle\", \"Заглавие в Google\", { max: 120, full: true, ph: `${S.name} — Барбершоп ${S.city} | Онлайн резервация` })}\n        ${F(\"seoDescription\", \"Описание в Google\", { max: 300, full: true, area: true })}\n      </div>\n    </div>\n\n    <div class=\"card\">\n      <h3>Резервно копие</h3><div class=\"sub\">Изтеглете настройките или ги прехвърлете от друг сайт (без снимките).</div>\n      <div class=\"actions\" style=\"justify-content:flex-start\">\n        <button class=\"btn sm\" id=\"expBtn\">⬇ Експорт</button>\n        <label class=\"btn sm\">⬆ Импорт<input type=\"file\" id=\"impIn\" accept=\"application/json\" hidden></label>\n      </div>\n    </div>\n\n    <div class=\"savebar\"><div class=\"in\"><span class=\"msg\" id=\"saveMsg\">Промените се записват с бутона.</span><button class=\"btn gold\" id=\"saveBtn\">Запази промените</button></div></div>\n  `);\n  bindShell();\n  renderServices(); renderHighlights(); renderFaq();\n  bindSettings();\n}\n\nfunction slotHTML(name, has, label) {\n  return `<div class=\"slot\" data-slot=\"${name}\">\n    ${has ? `<img src=\"/media/${name}?v=${S.mediaVersion || 1}\" alt=\"\"><button class=\"x\" data-rm=\"${name}\" title=\"Изтрий\">✕</button>` : label}\n    <input type=\"file\" accept=\"image/*\" hidden data-up=\"${name}\">\n  </div>`;\n}\n\nfunction markDirty() {\n  dirty = true;\n  const m = document.getElementById(\"saveMsg\");\n  if (m) { m.textContent = \"Имате незапазени промени.\"; m.className = \"msg\"; }\n}\n\nfunction renderServices() {\n  const box = document.getElementById(\"svcList\");\n  box.innerHTML = (S.services || []).map((s, i) => `\n    <div class=\"row-item\" data-i=\"${i}\">\n      <div class=\"top\"><b>Услуга ${i + 1}</b>\n        <button class=\"btn sm\" data-mv=\"-1\" ${i === 0 ? \"disabled\" : \"\"}>↑</button>\n        <button class=\"btn sm\" data-mv=\"1\" ${i === S.services.length - 1 ? \"disabled\" : \"\"}>↓</button>\n        <button class=\"btn sm danger\" data-rmsvc>✕</button></div>\n      <div class=\"g\">\n        <div class=\"wide\"><label class=\"l\">Име</label><input data-s=\"name\" value=\"${esc(s.name)}\" maxlength=\"60\"></div>\n        <div><label class=\"l\">Цена (€)</label><input data-s=\"price\" value=\"${esc(s.price ?? \"\")}\" inputmode=\"decimal\" placeholder=\"—\"></div>\n        <div><label class=\"l\">Минути</label><select data-s=\"duration\">${[10, 15, 20, 30, 40, 45, 60, 75, 90, 120, 150, 180, 240].map((m) => `<option value=\"${m}\" ${m === s.duration ? \"selected\" : \"\"}>${m}</option>`).join(\"\")}${[10, 15, 20, 30, 40, 45, 60, 75, 90, 120, 150, 180, 240].includes(s.duration) ? \"\" : `<option value=\"${s.duration}\" selected>${s.duration}</option>`}</select></div>\n        <div><label class=\"l\">Икона</label>${iconSelect(s.icon, 'data-s=\"icon\"')}</div>\n        <div class=\"full\"><label class=\"l\">Описание</label><input data-s=\"desc\" value=\"${esc(s.desc)}\" maxlength=\"200\"></div>\n        <label class=\"check full\"><input type=\"checkbox\" data-s=\"featured\" ${s.featured ? \"checked\" : \"\"}> Изтъкната (по-видима, показва се в началото)</label>\n      </div>\n    </div>`).join(\"\");\n  box.querySelectorAll(\".row-item\").forEach((row) => {\n    const i = Number(row.dataset.i);\n    row.querySelectorAll(\"[data-s]\").forEach((el) => el.addEventListener(el.type === \"checkbox\" || el.tagName === \"SELECT\" ? \"change\" : \"input\", () => {\n      const k = el.dataset.s;\n      S.services[i][k] = el.type === \"checkbox\" ? el.checked : k === \"duration\" ? Number(el.value) : k === \"price\" ? (el.value.trim() === \"\" ? null : el.value.trim()) : el.value;\n      markDirty();\n    }));\n    row.querySelectorAll(\"[data-mv]\").forEach((b) => b.onclick = () => {\n      const j = i + Number(b.dataset.mv);\n      [S.services[i], S.services[j]] = [S.services[j], S.services[i]];\n      markDirty(); renderServices();\n    });\n    row.querySelector(\"[data-rmsvc]\").onclick = () => {\n      if (S.services.length === 1) return alert(\"Трябва да има поне една услуга.\");\n      if (!confirm(`Да се изтрие ли „${S.services[i].name}“?`)) return;\n      S.services.splice(i, 1); markDirty(); renderServices();\n    };\n  });\n}\n\nfunction renderHighlights() {\n  const box = document.getElementById(\"hlList\");\n  S.highlights = S.highlights || [];\n  box.innerHTML = S.highlights.map((h, i) => `\n    <div class=\"row-item\" data-i=\"${i}\">\n      <div class=\"top\"><b>Предимство ${i + 1}</b><button class=\"btn sm danger\" data-rmhl>✕</button></div>\n      <div class=\"g\">\n        <div><label class=\"l\">Икона</label>${iconSelect(h.icon, 'data-h=\"icon\"')}</div>\n        <div class=\"wide\" style=\"grid-column:span 3\"><label class=\"l\">Заглавие</label><input data-h=\"title\" value=\"${esc(h.title)}\" maxlength=\"50\"></div>\n        <div class=\"full\"><label class=\"l\">Текст</label><input data-h=\"text\" value=\"${esc(h.text)}\" maxlength=\"120\"></div>\n      </div>\n    </div>`).join(\"\");\n  box.querySelectorAll(\".row-item\").forEach((row) => {\n    const i = Number(row.dataset.i);\n    row.querySelectorAll(\"[data-h]\").forEach((el) => el.addEventListener(el.tagName === \"SELECT\" ? \"change\" : \"input\", () => { S.highlights[i][el.dataset.h] = el.value; markDirty(); }));\n    row.querySelector(\"[data-rmhl]\").onclick = () => { S.highlights.splice(i, 1); markDirty(); renderHighlights(); };\n  });\n  document.getElementById(\"hlAdd\").disabled = S.highlights.length >= 4;\n}\n\nfunction renderFaq() {\n  const box = document.getElementById(\"faqList\");\n  S.faq = S.faq || [];\n  box.innerHTML = S.faq.map((f, i) => `\n    <div class=\"row-item\" data-i=\"${i}\">\n      <div class=\"top\"><b>Въпрос ${i + 1}</b><button class=\"btn sm danger\" data-rmfaq>✕</button></div>\n      <div class=\"g\">\n        <div class=\"full\"><label class=\"l\">Въпрос</label><input data-q=\"q\" value=\"${esc(f.q)}\" maxlength=\"150\"></div>\n        <div class=\"full\"><label class=\"l\">Отговор</label><textarea data-q=\"a\" maxlength=\"600\">${esc(f.a)}</textarea></div>\n      </div>\n    </div>`).join(\"\");\n  box.querySelectorAll(\".row-item\").forEach((row) => {\n    const i = Number(row.dataset.i);\n    row.querySelectorAll(\"[data-q]\").forEach((el) => el.addEventListener(\"input\", () => { S.faq[i][el.dataset.q] = el.value; markDirty(); }));\n    row.querySelector(\"[data-rmfaq]\").onclick = () => { S.faq.splice(i, 1); markDirty(); renderFaq(); };\n  });\n}\n\nfunction parseMaps(u) {\n  let m = String(u).match(/!3d(-?\\d+\\.\\d+)!4d(-?\\d+\\.\\d+)/);\n  if (!m) m = String(u).match(/@(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/);\n  if (!m) m = String(u).match(/[?&](?:q|query|destination)=(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)/);\n  return m ? { lat: Number(m[1]), lng: Number(m[2]) } : null;\n}\n\nfunction bindSettings() {\n  const $ = (id) => document.getElementById(id);\n  app.querySelectorAll(\"[data-color]\").forEach((c) => c.addEventListener(\"input\", () => {\n    app.querySelector(`[data-f=\"${c.dataset.color}\"]`).value = c.value; markDirty();\n  }));\n  app.querySelectorAll('[data-f=\"accent\"],[data-f=\"bg\"]').forEach((t) => t.addEventListener(\"input\", () => {\n    if (/^#[0-9a-f]{6}$/i.test(t.value)) app.querySelector(`[data-color=\"${t.dataset.f}\"]`).value = t.value;\n  }));\n  const mapsIn = app.querySelector('[data-f=\"mapsUrl\"]');\n  mapsIn.addEventListener(\"input\", () => {\n    const g = parseMaps(mapsIn.value);\n    const hint = mapsIn.parentElement.querySelector(\".hint\");\n    if (g) {\n      app.querySelector('[data-f=\"lat\"]').value = g.lat; app.querySelector('[data-f=\"lng\"]').value = g.lng;\n      hint.innerHTML = `<span class=\"ok\">✓ Координатите са попълнени.</span>`;\n    } else if (mapsIn.value) {\n      hint.textContent = \"Не намерих координати. При кратък линк (maps.app.goo.gl) го отворете в браузъра и копирайте пълния адрес.\";\n    }\n  });\n  app.querySelectorAll(\"[data-open]\").forEach((cb) => cb.addEventListener(\"change\", () => {\n    const d = cb.dataset.open;\n    app.querySelector(`[data-from=\"${d}\"]`).disabled = !cb.checked;\n    app.querySelector(`[data-to=\"${d}\"]`).disabled = !cb.checked;\n  }));\n  $(\"svcAdd\").onclick = () => {\n    S.services.push({ id: \"s\" + Date.now().toString(36), name: \"Нова услуга\", desc: \"\", price: null, duration: 30, icon: \"scissors\", featured: false });\n    markDirty(); renderServices();\n  };\n  $(\"hlAdd\").onclick = () => { if (S.highlights.length < 4) { S.highlights.push({ icon: \"star\", title: \"\", text: \"\" }); markDirty(); renderHighlights(); } };\n  $(\"faqAdd\").onclick = () => { S.faq.push({ q: \"\", a: \"\" }); markDirty(); renderFaq(); };\n\n  // media\n  bindSettingsMediaOnly();\n\n  $(\"expBtn\").onclick = () => {\n    const out = { ...collect() };\n    delete out.logo; delete out.gallery; delete out.mediaVersion;\n    const a = document.createElement(\"a\");\n    a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: \"application/json\" }));\n    a.download = `nastroiki-${(S.shortName || \"site\").toLowerCase().replace(/[^a-z0-9а-я]+/gi, \"-\")}.json`;\n    a.click();\n  };\n  $(\"impIn\").onchange = async (e) => {\n    const file = e.target.files[0]; if (!file) return;\n    try {\n      const data = JSON.parse(await file.text());\n      if (!confirm(\"Това ще замени текущите настройки (без снимките). Продължаване?\")) return;\n      delete data.logo; delete data.gallery; delete data.mediaVersion;\n      Object.assign(S, data); markDirty(); settingsView(); markDirty();\n    } catch { alert(\"Невалиден файл.\"); }\n  };\n  $(\"saveBtn\").onclick = save;\n}\n\nfunction bindSettingsMediaOnly() {\n  // re-attach handlers after upload/delete\n  app.querySelectorAll(\"[data-slot]\").forEach((slot) => {\n    if (slot.dataset.bound) return;\n    slot.dataset.bound = \"1\";\n    const name = slot.dataset.slot, input = slot.querySelector(\"[data-up]\");\n    slot.addEventListener(\"click\", (e) => { if (e.target.closest(\"[data-rm]\") || e.target === input) return; input.click(); });\n    input.addEventListener(\"change\", async () => {\n      const file = input.files[0]; if (!file) return;\n      slot.classList.add(\"busy\");\n      try {\n        const blob = await shrink(file, name === \"logo\" ? 700 : 1600, name === \"logo\");\n        const r = await api(\"POST\", `/api/admin/media?name=${name}`, blob, { \"content-type\": blob.type });\n        S.logo = r.settings.logo; S.gallery = r.settings.gallery; S.mediaVersion = r.settings.mediaVersion;\n        slot.outerHTML = slotHTML(name, name, \"\");\n        bindSettingsMediaOnly();\n      } catch (err) { alert(err.message); slot.classList.remove(\"busy\"); }\n    });\n  });\n  bindRemove();\n}\n\nfunction bindRemove() {\n  app.querySelectorAll(\"[data-rm]\").forEach((b) => {\n    if (b.dataset.bound) return;\n    b.dataset.bound = \"1\";\n    b.onclick = async (e) => {\n      e.stopPropagation();\n      if (!confirm(\"Да се изтрие ли снимката?\")) return;\n      const name = b.dataset.rm;\n      try {\n        const r = await api(\"DELETE\", `/api/admin/media?name=${name}`);\n        S.logo = r.settings.logo; S.gallery = r.settings.gallery; S.mediaVersion = r.settings.mediaVersion;\n        const slot = app.querySelector(`[data-slot=\"${name}\"]`);\n        slot.outerHTML = slotHTML(name, \"\", name === \"logo\" ? \"Качи лого\" : \"+ Снимка\");\n        bindSettingsMediaOnly();\n      } catch (err) { alert(err.message); }\n    };\n  });\n}\n\n// resize the photo in the browser before upload\nfunction shrink(file, maxSide, keepPng) {\n  return new Promise((resolve, reject) => {\n    const img = new Image();\n    img.onload = () => {\n      const k = Math.min(1, maxSide / Math.max(img.width, img.height));\n      const c = document.createElement(\"canvas\");\n      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);\n      c.getContext(\"2d\").drawImage(img, 0, 0, c.width, c.height);\n      const type = keepPng && file.type === \"image/png\" ? \"image/png\" : \"image/jpeg\";\n      c.toBlob((b) => (b ? resolve(b) : reject(new Error(\"Грешка при обработка на снимката.\"))), type, 0.84);\n      URL.revokeObjectURL(img.src);\n    };\n    img.onerror = () => reject(new Error(\"Файлът не е снимка.\"));\n    img.src = URL.createObjectURL(file);\n  });\n}\n\nfunction collect() {\n  const out = { ...S };\n  app.querySelectorAll(\"[data-f]\").forEach((el) => {\n    const k = el.dataset.f;\n    if ([\"chairs\", \"minLeadMinutes\", \"maxDaysAhead\", \"slotStep\"].includes(k)) out[k] = Number(el.value);\n    else if (k === \"lat\" || k === \"lng\") out[k] = el.value === \"\" ? null : Number(el.value);\n    else out[k] = el.value.trim();\n  });\n  out.badges = [0, 1].map((i) => ({\n    title: app.querySelector(`[data-badge=\"${i}.title\"]`).value.trim(),\n    text: app.querySelector(`[data-badge=\"${i}.text\"]`).value.trim(),\n  }));\n  out.marquee = document.getElementById(\"marqueeIn\").value.split(\",\").map((x) => x.trim()).filter(Boolean);\n  out.offer = {\n    enabled: document.getElementById(\"offOn\").checked,\n    eyebrow: document.getElementById(\"offEyebrow\").value.trim(),\n    title: document.getElementById(\"offTitle\").value.trim(),\n    price: document.getElementById(\"offPrice\").value.trim() === \"\" ? null : document.getElementById(\"offPrice\").value.trim(),\n    priceNote: document.getElementById(\"offNote\").value.trim(),\n    items: document.getElementById(\"offItems\").value.split(\"\\n\").map((x) => x.trim()).filter(Boolean),\n    serviceId: document.getElementById(\"offSvc\").value,\n  };\n  out.hours = {};\n  for (let d = 0; d < 7; d++) {\n    const open = app.querySelector(`[data-open=\"${d}\"]`).checked;\n    out.hours[d] = open ? [app.querySelector(`[data-from=\"${d}\"]`).value, app.querySelector(`[data-to=\"${d}\"]`).value] : null;\n  }\n  out.closedDates = document.getElementById(\"closedIn\").value.split(/\\s+/).map((x) => x.trim()).filter((x) => /^\\d{4}-\\d{2}-\\d{2}$/.test(x));\n  return out;\n}\n\nasync function save() {\n  const btn = document.getElementById(\"saveBtn\"), msg = document.getElementById(\"saveMsg\");\n  const data = collect();\n  for (let d = 0; d < 7; d++) {\n    const h = data.hours[d];\n    if (h && toMin(h[0]) >= toMin(h[1])) { msg.textContent = `${WEEKDAYS[d]}: часът на затваряне трябва да е след отварянето.`; msg.className = \"msg err\"; return; }\n  }\n  btn.disabled = true; btn.textContent = \"Записване…\";\n  try {\n    const r = await api(\"PUT\", \"/api/admin/settings\", data);\n    S = r.settings; dirty = false;\n    settingsView();\n    const m = document.getElementById(\"saveMsg\");\n    m.innerHTML = `<span class=\"ok\">✓ Запазено. Сайтът е обновен.</span>`;\n  } catch (e) {\n    msg.textContent = e.message; msg.className = \"msg err\";\n    btn.disabled = false; btn.textContent = \"Запази промените\";\n  }\n}\n\napp.addEventListener(\"input\", (e) => { if (tab === \"settings\" && e.target.closest(\".card\")) markDirty(); });\napp.addEventListener(\"change\", (e) => { if (tab === \"settings\" && e.target.closest(\".card\") && !e.target.closest(\"[data-slot]\")) markDirty(); });\naddEventListener(\"beforeunload\", (e) => { if (dirty) { e.preventDefault(); e.returnValue = \"\"; } });\nstart();\n</script>\n</body>\n</html>\n"},"/booking.js":{"t":"text/javascript; charset=utf-8","s":"// Shared time-slot logic, used by both the website and the server.\n// Every function receives the settings (cfg); none of them reads global values.\n\nexport const WEEKDAYS = [\"Неделя\", \"Понеделник\", \"Вторник\", \"Сряда\", \"Четвъртък\", \"Петък\", \"Събота\"];\nexport const WEEKDAYS_SHORT = [\"Нд\", \"Пн\", \"Вт\", \"Ср\", \"Чт\", \"Пт\", \"Сб\"];\nexport const MONTHS_SHORT = [\"яну\", \"фев\", \"мар\", \"апр\", \"май\", \"юни\", \"юли\", \"авг\", \"сеп\", \"окт\", \"ное\", \"дек\"];\n\nexport function toMin(t) {\n  const [h, m] = String(t).split(\":\").map(Number);\n  return h * 60 + m;\n}\n\nexport function fromMin(n) {\n  return String(Math.floor(n / 60)).padStart(2, \"0\") + \":\" + String(n % 60).padStart(2, \"0\");\n}\n\nexport function nowInZone(tz = \"Europe/Sofia\", date = new Date()) {\n  const parts = new Intl.DateTimeFormat(\"en-CA\", {\n    timeZone: tz, year: \"numeric\", month: \"2-digit\", day: \"2-digit\",\n    hour: \"2-digit\", minute: \"2-digit\", hourCycle: \"h23\",\n  }).formatToParts(date);\n  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));\n  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };\n}\n\nexport function addDays(dateStr, n) {\n  const d = new Date(dateStr + \"T12:00:00Z\");\n  d.setUTCDate(d.getUTCDate() + n);\n  return d.toISOString().slice(0, 10);\n}\n\nexport function weekday(dateStr) {\n  return new Date(dateStr + \"T12:00:00Z\").getUTCDay();\n}\n\nexport function dayHours(cfg, dateStr) {\n  const h = cfg.hours && cfg.hours[weekday(dateStr)];\n  if (!h || (cfg.closedDates || []).includes(dateStr)) return null;\n  return h;\n}\n\nexport function isOpenDay(cfg, dateStr) {\n  return !!dayHours(cfg, dateStr);\n}\n\nexport function overlapCount(busy, start, duration) {\n  return busy.filter((b) => {\n    const s = toMin(b.time);\n    return start < s + b.duration && s < start + duration;\n  }).length;\n}\n\n// busy = [{ time: \"10:00\", duration: 30 }, ...]\nexport function availableStarts(cfg, dateStr, duration, busy = [], now = nowInZone(cfg.timeZone)) {\n  if (dateStr < now.date || dateStr > addDays(now.date, cfg.maxDaysAhead)) return [];\n  const h = dayHours(cfg, dateStr);\n  if (!h) return [];\n  const [open, close] = h.map(toMin);\n  const out = [];\n  for (let t = open; t + duration <= close; t += cfg.slotStep) {\n    if (dateStr === now.date && t < now.minutes + cfg.minLeadMinutes) continue;\n    if (overlapCount(busy, t, duration) >= cfg.chairs) continue;\n    out.push(fromMin(t));\n  }\n  return out;\n}\n\nexport function bookableDates(cfg, now = nowInZone(cfg.timeZone)) {\n  const out = [];\n  const shortest = Math.min(...(cfg.services || []).map((s) => s.duration), 600);\n  for (let i = 0; i <= cfg.maxDaysAhead; i++) {\n    const d = addDays(now.date, i);\n    if (!isOpenDay(cfg, d)) continue;\n    if (i === 0 && !availableStarts(cfg, d, shortest, [], now).length) continue;\n    out.push(d);\n  }\n  return out;\n}\n\nexport function formatDateBG(dateStr) {\n  const [y, m, d] = dateStr.split(\"-\").map(Number);\n  return `${WEEKDAYS[weekday(dateStr)]}, ${d} ${MONTHS_SHORT[m - 1]} ${y}`;\n}\n\nexport function phoneDisplay(phone) {\n  const p = String(phone || \"\").replace(/[^\\d+]/g, \"\");\n  if (p.startsWith(\"+359\") && p.length === 13) {\n    const r = \"0\" + p.slice(4);\n    return `${r.slice(0, 4)} ${r.slice(4, 7)} ${r.slice(7)}`;\n  }\n  return phone || \"\";\n}\n\nexport function priceText(p) {\n  return p == null || p === \"\" ? \"по запитване\" : `${p} €`;\n}\n\nexport function durText(m) {\n  if (m < 60) return `${m} мин`;\n  const h = m / 60;\n  return `${Number.isInteger(h) ? h : h.toFixed(1)} ч`;\n}\n"}};

// ---------- worker ----------
// =====================================================================
//  BARBER BOOKING — Cloudflare Worker
//  Requires: D1 binding "DB"; secrets ADMIN_PASSWORD,
//  TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (optional: SITE_URL)
//  PRESET and ASSETS are added by build.mjs
// =====================================================================

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

