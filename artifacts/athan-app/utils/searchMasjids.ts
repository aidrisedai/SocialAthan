import type { Masjid } from "@/context/AppContext";

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

export async function searchNearbyMasjids(
  lat: number,
  lng: number,
  radiusMeters = 10000
): Promise<Masjid[]> {
  const query = `
[out:json][timeout:15];
(
  node["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${lat},${lng});
  way["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${lat},${lng});
  relation["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${lat},${lng});
);
out center 40;
`;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (!response.ok) {
    throw new Error(`Overpass API returned ${response.status}`);
  }

  const json = await response.json();
  const elements: OverpassElement[] = json.elements ?? [];

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

    results.push({
      id: `osm_${el.type}_${el.id}`,
      name: rawName,
      address,
      distance: distMi,
      lat: elLat,
      lng: elLng,
      claimed: false,
      memberCount: 0,
    });
  }

  return results.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
}
