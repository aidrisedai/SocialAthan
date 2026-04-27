import type { Masjid } from "@/context/AppContext";

interface OverpassElement {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string | undefined>;
}

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://z.overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

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

async function fetchFromEndpoint(endpoint: string, query: string): Promise<OverpassElement[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Overpass ${new URL(endpoint).hostname} returned ${response.status}`);
    }
    const json = await response.json();
    return json.elements ?? [];
  } finally {
    clearTimeout(timer);
  }
}

export async function searchNearbyMasjids(
  lat: number,
  lng: number,
  radiusMeters = 10000
): Promise<Masjid[]> {
  const query = [
    `[out:json][timeout:25];`,
    `(`,
    `  node["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${lat},${lng});`,
    `  way["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${lat},${lng});`,
    `  relation["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${lat},${lng});`,
    `);`,
    `out center tags 50;`,
  ].join("\n");

  let lastError: Error | null = null;
  let elements: OverpassElement[] = [];

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      elements = await fetchFromEndpoint(endpoint, query);
      lastError = null;
      break;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (__DEV__) console.warn(`[searchMasjids] ${lastError.message}, trying next…`);
    }
  }

  if (lastError) throw lastError;

  const seen = new Set<string>();
  const results: Masjid[] = [];

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

  return results.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
}
