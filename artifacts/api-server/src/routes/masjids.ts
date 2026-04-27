import { Router } from "express";

const router = Router();

const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha", "jummah"] as const;
type Prayer = (typeof PRAYERS)[number];
type TimeOverrides = Partial<Record<Prayer, { adhan?: string; iqamah?: string }>>;

const PRAYER_ALIASES: Record<string, Prayer> = {
  fajr: "fajr", subh: "fajr", dawn: "fajr", sobh: "fajr",
  dhuhr: "dhuhr", zuhr: "dhuhr", zhuhr: "dhuhr", dhuhur: "dhuhr", noon: "dhuhr", dhuha: "dhuhr",
  asr: "asr", asar: "asr", afternoon: "asr",
  maghrib: "maghrib", maghreb: "maghrib", sunset: "maghrib",
  isha: "isha", isha2: "isha", night: "isha",
  jummah: "jummah", jumuah: "jummah", jumah: "jummah", juma: "jummah", friday: "jummah",
};

const IQAMAH_WORDS = ["iqamah", "iqama", "iqamat", "jamaat", "jamat", "congregation", "jama"];

const TIME_RE = /\b(1[0-2]|0?[1-9]):[0-5]\d\s*(?:AM|PM|am|pm)\b/g;

const ALADHAN_METHOD: Record<string, number> = {
  isna: 2, mwl: 3, umm: 4, egypt: 5, karachi: 1,
};

const ALADHAN_PRAYER_MAP: Partial<Record<Prayer, string>> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  jummah: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

function to12Hour(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10);
  if (isNaN(h)) return "";
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${mStr} ${period}`;
}

function normalizeTime(t: string): string {
  return t.replace(/\s+/g, " ").trim().toUpperCase();
}

function extractTimes(text: string): string[] {
  const found: string[] = [];
  let m: RegExpExecArray | null;
  TIME_RE.lastIndex = 0;
  while ((m = TIME_RE.exec(text)) !== null) {
    found.push(normalizeTime(m[0]));
  }
  return found;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#\d+;/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function prayerForToken(token: string): Prayer | null {
  return PRAYER_ALIASES[token.toLowerCase().replace(/[^a-z]/g, "")] ?? null;
}

function parseWebsite(text: string): TimeOverrides {
  const result: TimeOverrides = {};
  const lower = text.toLowerCase();

  for (const prayer of PRAYERS) {
    const aliases = Object.entries(PRAYER_ALIASES)
      .filter(([, v]) => v === prayer)
      .map(([k]) => k);

    for (const alias of aliases) {
      const idx = lower.indexOf(alias);
      if (idx === -1) continue;

      const chunk = text.slice(Math.max(0, idx), Math.min(text.length, idx + 300));
      const times = extractTimes(chunk);
      if (times.length === 0) continue;

      const entry: { adhan?: string; iqamah?: string } = result[prayer] ?? {};
      if (!entry.adhan) entry.adhan = times[0];

      if (!entry.iqamah && times.length >= 2) {
        const chunkLower = chunk.toLowerCase();
        const iqamahOffset = IQAMAH_WORDS.map((w) => chunkLower.indexOf(w)).find((i) => i !== -1);
        if (iqamahOffset !== undefined) {
          const after = chunk.slice(iqamahOffset);
          const iqamahTimes = extractTimes(after);
          entry.iqamah = iqamahTimes[0] ?? times[1];
        } else {
          entry.iqamah = times[1];
        }
      }

      result[prayer] = entry;
      break;
    }
  }

  if (Object.keys(result).length >= 4) return result;

  const lines = text.split(/[\n\r|]+/).map((l) => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length - 1; i++) {
    const headerTokens = lines[i].split(/\s{2,}|\t/).map((t) => t.trim()).filter(Boolean);
    const prayerColumns: Array<{ prayer: Prayer; col: number }> = [];
    headerTokens.forEach((tok, col) => {
      const p = prayerForToken(tok);
      if (p) prayerColumns.push({ prayer: p, col });
    });
    if (prayerColumns.length < 3) continue;

    const dataRows: string[][] = [];
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      const cells = lines[j].split(/\s{2,}|\t/).map((c) => c.trim()).filter(Boolean);
      const timeLike = cells.filter((c) => TIME_RE.test(c) || c === "-");
      TIME_RE.lastIndex = 0;
      if (timeLike.length >= prayerColumns.length - 1) dataRows.push(cells);
    }
    if (dataRows.length === 0) continue;

    const adhanRow = dataRows[0];
    const iqamahRow = dataRows.length >= 2 ? dataRows[1] : null;
    const isAdhanLabeled = adhanRow[0]?.toLowerCase().includes("adhan") ?? false;
    const isIqamahLabeled = iqamahRow?.[0]
      ? IQAMAH_WORDS.some((w) => iqamahRow[0].toLowerCase().includes(w))
      : false;
    const adhanOff = isAdhanLabeled ? 1 : 0;
    const iqamahOff = isIqamahLabeled ? 1 : 0;

    for (const { prayer, col } of prayerColumns) {
      const entry = result[prayer] ?? {};
      const adhanCell = adhanRow[col + adhanOff];
      if (adhanCell && !entry.adhan) {
        const t = extractTimes(adhanCell);
        if (t.length > 0) entry.adhan = t[0];
      }
      if (iqamahRow) {
        const iqamahCell = iqamahRow[col + iqamahOff];
        if (iqamahCell && !entry.iqamah) {
          const t = extractTimes(iqamahCell);
          if (t.length > 0) entry.iqamah = t[0];
        }
      }
      result[prayer] = entry;
    }

    if (Object.keys(result).length >= 4) break;
  }

  return result;
}

async function fetchWebsiteTimes(url: string): Promise<TimeOverrides> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) return {};
  } catch {
    return {};
  }

  const pagesToTry = [
    parsedUrl.href,
    new URL("/prayer-times", parsedUrl.origin).href,
    new URL("/salah-times", parsedUrl.origin).href,
    new URL("/iqama", parsedUrl.origin).href,
    new URL("/prayers", parsedUrl.origin).href,
    new URL("/schedule", parsedUrl.origin).href,
  ];

  let best: TimeOverrides = {};
  let bestScore = 0;

  for (const pageUrl of pagesToTry) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const resp = await fetch(pageUrl, {
        signal: ctrl.signal,
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AthanBot/1.0)" },
      });
      clearTimeout(timer);
      if (!resp.ok) continue;
      const html = await resp.text();
      const parsed = parseWebsite(stripHtml(html));
      const score = Object.values(parsed).filter((v) => v?.iqamah).length;
      if (score > bestScore) { bestScore = score; best = parsed; }
      if (score >= 4) break;
    } catch {
      continue;
    }
  }
  return best;
}

async function fetchAladhanTimes(
  lat: number,
  lng: number,
  method = "isna"
): Promise<Partial<Record<Prayer, string>>> {
  const methodId = ALADHAN_METHOD[method] ?? 2;
  const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=${methodId}`;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const resp = await fetch(url, { signal: ctrl.signal, redirect: "follow" });
    clearTimeout(timer);
    if (!resp.ok) return {};
    const json = (await resp.json()) as {
      code: number;
      data: { timings: Record<string, string> };
    };
    if (json.code !== 200) return {};

    const timings = json.data.timings;
    const result: Partial<Record<Prayer, string>> = {};
    for (const [prayer, aladhanKey] of Object.entries(ALADHAN_PRAYER_MAP)) {
      const raw = timings[aladhanKey as string];
      if (raw) result[prayer as Prayer] = to12Hour(raw.replace(/\s*\(.*\)/, "").trim());
    }
    return result;
  } catch {
    return {};
  }
}

router.post("/masjids/fetch-times", async (req, res) => {
  const { url, lat, lng, method } = req.body as {
    url?: string;
    lat?: number;
    lng?: number;
    method?: string;
  };

  const hasCoords = typeof lat === "number" && typeof lng === "number";

  if (!url && !hasCoords) {
    res.status(400).json({ error: "url or lat/lng required" });
    return;
  }

  const overrides: TimeOverrides = {};

  // ── Step 1: try website parser ──────────────────────────────────────────
  if (url) {
    const websiteResult = await fetchWebsiteTimes(url);
    for (const prayer of PRAYERS) {
      const v = websiteResult[prayer];
      if (v) overrides[prayer] = { ...overrides[prayer], ...v };
    }
  }

  // ── Step 2: fill missing adhan times from Aladhan ───────────────────────
  if (hasCoords) {
    const missing = PRAYERS.filter((p) => !overrides[p]?.adhan);
    if (missing.length > 0) {
      const aladhan = await fetchAladhanTimes(lat as number, lng as number, method);
      for (const prayer of missing) {
        const adhanTime = aladhan[prayer];
        if (adhanTime) {
          overrides[prayer] = {
            adhan: adhanTime,
            iqamah: overrides[prayer]?.iqamah,
          };
        }
      }
    }
  }

  const filledCount = Object.values(overrides).filter((v) => v?.adhan || v?.iqamah).length;

  if (filledCount === 0) {
    res.status(404).json({ error: "Could not find prayer times. Check the URL and try again." });
    return;
  }

  res.json({ overrides, sources: { website: !!url, aladhan: hasCoords } });
});

export default router;
