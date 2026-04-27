import { Router } from "express";

const router = Router();

const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha", "jummah"] as const;
type Prayer = (typeof PRAYERS)[number];

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

function findPrayerTimesInText(text: string): Partial<Record<Prayer, { adhan?: string; iqamah?: string }>> {
  const result: Partial<Record<Prayer, { adhan?: string; iqamah?: string }>> = {};
  const lower = text.toLowerCase();

  // ── Strategy 1: inline pattern "Fajr ... [time] ... [time?]" ──
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

  // ── Strategy 2: columnar table — header row has prayer names, data rows have times ──
  const lines = text.split(/[\n\r|]+/).map((l) => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length - 1; i++) {
    const headerTokens = lines[i].split(/\s{2,}|\t/).map((t) => t.trim()).filter(Boolean);
    const prayerColumns: Array<{ prayer: Prayer; col: number }> = [];

    headerTokens.forEach((tok, col) => {
      const p = prayerForToken(tok);
      if (p) prayerColumns.push({ prayer: p, col });
    });

    if (prayerColumns.length < 3) continue;

    // Collect data rows (rows where most cells look like times or dashes)
    const dataRows: string[][] = [];
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      const cells = lines[j].split(/\s{2,}|\t/).map((c) => c.trim()).filter(Boolean);
      const timeLike = cells.filter((c) => TIME_RE.test(c) || c === "-");
      TIME_RE.lastIndex = 0;
      if (timeLike.length >= prayerColumns.length - 1) dataRows.push(cells);
    }

    if (dataRows.length === 0) continue;

    // First data row = adhan, second = iqamah (if present and labeled or just second)
    const adhanRow = dataRows[0];
    const iqamahRow = dataRows.length >= 2 ? dataRows[1] : null;

    const isAdhanLabeled = adhanRow[0] && PRAYER_ALIASES[adhanRow[0].toLowerCase()] === undefined
      && adhanRow[0].toLowerCase().includes("adhan");
    const isIqamahLabeled = iqamahRow?.[0]
      && IQAMAH_WORDS.some((w) => iqamahRow[0].toLowerCase().includes(w));

    const adhanOffset = isAdhanLabeled ? 1 : 0;
    const iqamahOffset2 = isIqamahLabeled ? 1 : 0;

    for (const { prayer, col } of prayerColumns) {
      const entry = result[prayer] ?? {};
      const adhanCell = adhanRow[col + adhanOffset];
      if (adhanCell) {
        const t = extractTimes(adhanCell);
        if (t.length > 0 && !entry.adhan) entry.adhan = t[0];
      }
      if (iqamahRow) {
        const iqamahCell = iqamahRow[col + iqamahOffset2];
        if (iqamahCell) {
          const t = extractTimes(iqamahCell);
          if (t.length > 0 && !entry.iqamah) entry.iqamah = t[0];
        }
      }
      result[prayer] = entry;
    }

    if (Object.keys(result).length >= 4) break;
  }

  return result;
}


router.post("/masjids/fetch-times", async (req, res) => {
  const { url } = req.body as { url?: string };
  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "url is required" });
    return;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error("bad protocol");
  } catch {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  const pagesToTry = [
    parsedUrl.href,
    new URL("/prayer-times", parsedUrl.origin).href,
    new URL("/salah-times", parsedUrl.origin).href,
    new URL("/iqama", parsedUrl.origin).href,
    new URL("/prayers", parsedUrl.origin).href,
    new URL("/schedule", parsedUrl.origin).href,
  ];

  let bestResult: Partial<Record<Prayer, { adhan?: string; iqamah?: string }>> = {};
  let bestScore = 0;

  for (const pageUrl of pagesToTry) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(pageUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AthanBot/1.0)" },
      });
      clearTimeout(timeout);

      if (!response.ok) continue;
      const html = await response.text();
      const text = stripHtml(html);
      const parsed = findPrayerTimesInText(text);
      const score = Object.keys(parsed).length;
      if (score > bestScore) {
        bestScore = score;
        bestResult = parsed;
      }
      if (score >= 4) break;
    } catch {
      continue;
    }
  }

  if (bestScore === 0) {
    res.status(404).json({ error: "Could not find prayer times on this website." });
    return;
  }

  res.json({ overrides: bestResult });
});

export default router;
