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

// ── Nearby masjids proxy (Overpass server-side) ─────────────────────────────
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://z.overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

interface OverpassElement {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string | undefined>;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function queryOneEndpoint(endpoint: string, query: string, timeoutMs: number): Promise<OverpassElement[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal: ctrl.signal,
    });
    if (!resp.ok) {
      throw new Error(`Overpass ${new URL(endpoint).hostname} returned ${resp.status}`);
    }
    const json = (await resp.json()) as { elements?: OverpassElement[] };
    return json.elements ?? [];
  } finally {
    clearTimeout(timer);
  }
}

// Race all mirrors in parallel — the first one to respond wins. Stragglers are aborted.
async function queryOverpass(query: string): Promise<OverpassElement[]> {
  const masterCtrl = new AbortController();
  const attempts = OVERPASS_ENDPOINTS.map(async (endpoint) => {
    try {
      const result = await queryOneEndpoint(endpoint, query, 8000);
      masterCtrl.abort();
      return result;
    } catch (err) {
      throw err instanceof Error ? err : new Error(String(err));
    }
  });
  try {
    return await Promise.any(attempts);
  } catch (err) {
    if (err instanceof AggregateError) {
      throw new Error(`All Overpass endpoints failed: ${err.errors.map((e) => (e as Error).message).join("; ")}`);
    }
    throw err;
  }
}

// In-memory cache keyed by rounded lat/lng/radius. 10-minute TTL.
interface CacheEntry {
  expires: number;
  payload: object[];
}
const NEARBY_CACHE = new Map<string, CacheEntry>();
const NEARBY_CACHE_TTL_MS = 10 * 60_000;
const NEARBY_CACHE_MAX = 200;

function cacheKey(lat: number, lng: number, radius: number): string {
  // ~250m grid (4dp ≈ 11m, 3dp ≈ 110m, 2dp ≈ 1.1km). Use 2dp + radius bucket so neighbors share a key.
  return `${lat.toFixed(2)}|${lng.toFixed(2)}|${Math.round(radius / 1000)}`;
}

function cacheGet(key: string): object[] | null {
  const hit = NEARBY_CACHE.get(key);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    NEARBY_CACHE.delete(key);
    return null;
  }
  return hit.payload;
}

function cacheSet(key: string, payload: object[]) {
  if (NEARBY_CACHE.size >= NEARBY_CACHE_MAX) {
    const firstKey = NEARBY_CACHE.keys().next().value;
    if (firstKey) NEARBY_CACHE.delete(firstKey);
  }
  NEARBY_CACHE.set(key, { expires: Date.now() + NEARBY_CACHE_TTL_MS, payload });
}

router.get("/masjids/nearby", async (req, res) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const radius = parseInt((req.query.radius as string) ?? "10000", 10);

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: "lat and lng are required" });
    return;
  }

  const clampedRadius = Math.min(Math.max(radius, 1000), 50000);
  const ck = cacheKey(lat, lng, clampedRadius);
  const cached = cacheGet(ck);
  if (cached) {
    res.json({ masjids: cached, cached: true });
    return;
  }

  const query = [
    `[out:json][timeout:10];`,
    `(`,
    `  node["amenity"="place_of_worship"]["religion"="muslim"](around:${clampedRadius},${lat},${lng});`,
    `  way["amenity"="place_of_worship"]["religion"="muslim"](around:${clampedRadius},${lat},${lng});`,
    `  relation["amenity"="place_of_worship"]["religion"="muslim"](around:${clampedRadius},${lat},${lng});`,
    `);`,
    `out center tags 50;`,
  ].join("\n");

  try {
    const elements = await queryOverpass(query);
    const seen = new Set<string>();
    const results: object[] = [];

    for (const el of elements) {
      const elLat = el.lat ?? el.center?.lat ?? 0;
      const elLng = el.lon ?? el.center?.lon ?? 0;
      if (!elLat && !elLng) continue;

      const rawName =
        el.tags?.["name:en"] ??
        el.tags?.["name"] ??
        el.tags?.["official_name"] ??
        "Islamic Center";

      const key = rawName.toLowerCase().trim();
      if (seen.has(key)) continue;
      seen.add(key);

      const addrParts = [
        el.tags?.["addr:housenumber"],
        el.tags?.["addr:street"],
        el.tags?.["addr:city"],
        el.tags?.["addr:state"],
      ].filter(Boolean);

      const address = addrParts.length > 0 ? addrParts.join(", ") : "Address not listed";
      const distMi = parseFloat((haversineKm(lat, lng, elLat, elLng) * 0.621371).toFixed(1));

      const website =
        el.tags?.["website"] ??
        el.tags?.["contact:website"] ??
        el.tags?.["url"] ??
        undefined;

      results.push({
        id: `osm_${el.type}_${el.id}`,
        name: rawName,
        address,
        distance: distMi,
        lat: elLat,
        lng: elLng,
        claimed: false,
        memberCount: 0,
        website,
      });
    }

    results.sort((a: any, b: any) => (a.distance ?? 999) - (b.distance ?? 999));
    cacheSet(ck, results);
    res.json({ masjids: results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: `Overpass query failed: ${msg}` });
  }
});

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
