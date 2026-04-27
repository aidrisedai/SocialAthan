import {
  Coordinates,
  CalculationMethod,
  CalculationParameters,
  PrayerTimes,
  Prayer as AdhanPrayer,
  Madhab,
} from "adhan";
import { Prayer } from "@/context/AppContext";

export type CalcMethod = "isna" | "mwl" | "umm" | "egypt" | "karachi";

export interface ComputedPrayer {
  prayer: Prayer;
  label: string;
  adhan: string;
  iqamahOffset: number;
  adhanDate: string;
}

const IQAMAH_OFFSETS: Record<Prayer, number> = {
  fajr: 20,
  dhuhr: 15,
  asr: 15,
  maghrib: 5,
  isha: 15,
  jummah: 30,
};

function getParams(method: CalcMethod): CalculationParameters {
  switch (method) {
    case "mwl":
      return CalculationMethod.MuslimWorldLeague();
    case "umm":
      return CalculationMethod.UmmAlQura();
    case "egypt":
      return CalculationMethod.Egyptian();
    case "karachi":
      return CalculationMethod.Karachi();
    case "isna":
    default:
      return CalculationMethod.NorthAmerica();
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function computePrayerTimes(
  lat: number,
  lng: number,
  method: CalcMethod = "isna"
): ComputedPrayer[] {
  const coordinates = new Coordinates(lat, lng);
  const params = getParams(method);
  const date = new Date();
  const times = new PrayerTimes(coordinates, date, params);

  const isJummuah = date.getDay() === 5;

  const prayers: ComputedPrayer[] = [
    {
      prayer: "fajr",
      label: "Fajr",
      adhan: formatTime(times.fajr),
      iqamahOffset: IQAMAH_OFFSETS.fajr,
      adhanDate: times.fajr.toISOString(),
    },
    {
      prayer: isJummuah ? "jummah" : "dhuhr",
      label: isJummuah ? "Jumu'ah" : "Dhuhr",
      adhan: isJummuah
        ? formatTime(addMinutes(times.dhuhr, 12))
        : formatTime(times.dhuhr),
      iqamahOffset: isJummuah ? IQAMAH_OFFSETS.jummah : IQAMAH_OFFSETS.dhuhr,
      adhanDate: isJummuah
        ? addMinutes(times.dhuhr, 12).toISOString()
        : times.dhuhr.toISOString(),
    },
    {
      prayer: "asr",
      label: "Asr",
      adhan: formatTime(times.asr),
      iqamahOffset: IQAMAH_OFFSETS.asr,
      adhanDate: times.asr.toISOString(),
    },
    {
      prayer: "maghrib",
      label: "Maghrib",
      adhan: formatTime(times.maghrib),
      iqamahOffset: IQAMAH_OFFSETS.maghrib,
      adhanDate: times.maghrib.toISOString(),
    },
    {
      prayer: "isha",
      label: "Isha",
      adhan: formatTime(times.isha),
      iqamahOffset: IQAMAH_OFFSETS.isha,
      adhanDate: times.isha.toISOString(),
    },
  ];

  return prayers;
}

export function formatIqamah(adhanTimeStr: string, offsetMinutes: number): string {
  const today = new Date().toDateString();
  const parsed = new Date(`${today} ${adhanTimeStr}`);
  if (isNaN(parsed.getTime())) return "";
  return formatTime(addMinutes(parsed, offsetMinutes));
}
