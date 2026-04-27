import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import { CalcMethod, computePrayerTimes, formatIqamah } from "@/utils/prayerTimes";
import { scheduleAllPrayerNotifications, setupNotificationChannel } from "@/utils/notifications";

export type Prayer = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha" | "jummah";

export type RSVPStatus = "going" | "maybe" | "cant" | null;

export interface PrayerTime {
  prayer: Prayer;
  label: string;
  adhan: string;
  iqamah: string;
  adhanDate: string;
  rsvp: RSVPStatus;
  completed: boolean;
}

export interface MasjidTimeOverride {
  adhan: string;
  iqamah: string;
}

export interface Masjid {
  id: string;
  name: string;
  address: string;
  distance?: number;
  lat: number;
  lng: number;
  claimed: boolean;
  adminIds?: string[];
  timeOverrides?: Partial<Record<Prayer, MasjidTimeOverride>>;
  memberCount: number;
}

export interface Friend {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  isConnected: boolean;
}

export interface StreakEntry {
  prayer: Prayer;
  label: string;
  count: number;
  lastDate: string | null;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface NotificationSettings {
  masterEnabled: boolean;
  adhan: boolean;
  iqamah: boolean;
  rsvpPrompt: boolean;
  friendRSVPs: boolean;
  encouragements: boolean;
  nudges: boolean;
  streakReminders: boolean;
  adhanReciter: string;
  perPrayer: Record<Prayer, { adhan: boolean; iqamah: boolean }>;
}

export interface AppUser {
  id: string;
  name: string;
  username: string;
  primaryMasjidId: string | null;
  occasionalMasjidIds: string[];
  isAdmin: boolean;
  adminMasjidIds: string[];
}

interface AppContextValue {
  user: AppUser | null;
  onboardingComplete: boolean;
  setOnboardingComplete: (v: boolean) => void;
  primaryMasjid: Masjid | null;
  setPrimaryMasjid: (m: Masjid) => void;
  nearbyMasjids: Masjid[];
  prayerTimes: PrayerTime[];
  updateRSVP: (prayer: Prayer, status: RSVPStatus) => void;
  calcMethod: CalcMethod;
  setCalcMethod: (method: CalcMethod) => void;
  friends: Friend[];
  addFriend: (friend: Friend) => void;
  removeFriend: (id: string) => void;
  streaks: StreakEntry[];
  markPrayerAttended: (prayer: Prayer) => void;
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (s: Partial<NotificationSettings>) => void;
  messages: Record<string, Message[]>;
  sendMessage: (chatId: string, text: string) => void;
  updateUser: (updates: Partial<AppUser>) => void;
  friendRSVPs: Record<string, Partial<Record<Prayer, Friend[]>>>;
  updateMasjidTimes: (masjidId: string, overrides: Partial<Record<Prayer, MasjidTimeOverride>>) => void;
  pendingRSVP: Prayer | null;
  clearPendingRSVP: () => void;
  setPendingRSVP: (prayer: Prayer) => void;
  coords: { lat: number; lng: number };
  occasionalMasjids: Masjid[];
  addOccasionalMasjid: (masjidId: string) => void;
  removeOccasionalMasjid: (masjidId: string) => void;
}

const DEFAULT_COORDS = { lat: 40.7128, lng: -74.006 };

const NEARBY_MASJIDS: Masjid[] = [
  {
    id: "m1",
    name: "Masjid Al-Noor",
    address: "123 Oak Street, Springfield, IL",
    distance: 0.4,
    lat: 39.781721,
    lng: -89.650148,
    claimed: true,
    memberCount: 247,
  },
  {
    id: "m2",
    name: "Islamic Center of Springfield",
    address: "456 Elm Avenue, Springfield, IL",
    distance: 1.2,
    lat: 39.790000,
    lng: -89.642000,
    claimed: true,
    memberCount: 512,
  },
  {
    id: "m3",
    name: "Masjid As-Salam",
    address: "789 Maple Drive, Springfield, IL",
    distance: 2.8,
    lat: 39.771000,
    lng: -89.655000,
    claimed: false,
    memberCount: 89,
  },
];

const SAMPLE_FRIENDS: Friend[] = [
  { id: "f1", name: "Ibrahim Hassan", username: "ibrahim.h", isConnected: true },
  { id: "f2", name: "Yusuf Malik", username: "yusuf_m", isConnected: true },
  { id: "f3", name: "Omar Abdullah", username: "omar_a", isConnected: true },
];

function makeSeedMsg(id: string, senderId: string, text: string, msAgo: number): Message {
  return { id, senderId, text, timestamp: Date.now() - msAgo };
}

const SEED_MESSAGES: Record<string, Message[]> = {
  "dm_f1": [
    makeSeedMsg("seed_f1_1", "f1",     "Assalamu alaykum! Joining for Fajr today?", 3_600_000),
    makeSeedMsg("seed_f1_2", "user1",  "Wa alaykum assalam! Insha'Allah, see you there.", 3_500_000),
    makeSeedMsg("seed_f1_3", "f1",     "Barak Allahu feek 🤲", 3_400_000),
  ],
  "dm_f2": [
    makeSeedMsg("seed_f2_1", "user1",  "Yusuf, are you going to Dhuhr today?", 7_200_000),
    makeSeedMsg("seed_f2_2", "f2",     "Yes! Already heading out. Meet at the masjid.", 7_100_000),
    makeSeedMsg("seed_f2_3", "user1",  "Perfect, see you in 10 minutes.", 7_000_000),
  ],
  "dm_f3": [
    makeSeedMsg("seed_f3_1", "f3",     "Don't forget Maghrib tonight — special lecture after.", 1_800_000),
    makeSeedMsg("seed_f3_2", "user1",  "JazakAllah khair for the reminder!", 1_700_000),
  ],
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  masterEnabled: true,
  adhan: true,
  iqamah: true,
  rsvpPrompt: true,
  friendRSVPs: true,
  encouragements: true,
  nudges: true,
  streakReminders: true,
  adhanReciter: "makkah",
  perPrayer: {
    fajr:    { adhan: true, iqamah: true },
    dhuhr:   { adhan: true, iqamah: true },
    asr:     { adhan: true, iqamah: true },
    maghrib: { adhan: true, iqamah: true },
    isha:    { adhan: true, iqamah: true },
    jummah:  { adhan: true, iqamah: true },
  },
};

export function buildPrayerTimes(
  coords: { lat: number; lng: number },
  method: CalcMethod,
  masjid: Masjid | null,
  existingRsvps: Partial<Record<Prayer, RSVPStatus>>
): PrayerTime[] {
  const computed = computePrayerTimes(coords.lat, coords.lng, method);
  const now = new Date();

  return computed.map((cp) => {
    const override = masjid?.timeOverrides?.[cp.prayer];
    const adhan = override?.adhan ?? cp.adhan;

    let adhanDate = cp.adhanDate;
    if (override?.adhan) {
      const today = new Date().toDateString();
      const parsed = new Date(`${today} ${override.adhan}`);
      adhanDate = !isNaN(parsed.getTime()) ? parsed.toISOString() : cp.adhanDate;
    }

    const iqamah = override?.iqamah ?? formatIqamah(adhan, cp.iqamahOffset);

    const adhanTime = new Date(adhanDate);
    const completed = !isNaN(adhanTime.getTime()) && adhanTime < new Date(now.getTime() - 15 * 60_000);

    return {
      prayer: cp.prayer,
      label: cp.label,
      adhan,
      iqamah,
      adhanDate,
      rsvp: existingRsvps[cp.prayer] ?? null,
      completed,
    };
  });
}

function getDefaultStreaks(): StreakEntry[] {
  return [
    { prayer: "fajr", label: "Fajr", count: 7, lastDate: new Date().toDateString() },
    { prayer: "dhuhr", label: "Dhuhr", count: 3, lastDate: new Date().toDateString() },
    { prayer: "asr", label: "Asr", count: 5, lastDate: new Date().toDateString() },
    { prayer: "maghrib", label: "Maghrib", count: 14, lastDate: new Date().toDateString() },
    { prayer: "isha", label: "Isha", count: 2, lastDate: null },
  ];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [onboardingComplete, setOnboardingCompleteState] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [primaryMasjid, setPrimaryMasjidState] = useState<Masjid | null>(null);
  const [masjidList, setMasjidList] = useState<Masjid[]>(NEARBY_MASJIDS);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [prayerRsvps, setPrayerRsvps] = useState<Partial<Record<Prayer, RSVPStatus>>>({});
  const [pendingRSVP, setPendingRSVPState] = useState<Prayer | null>(null);
  const [calcMethod, setCalcMethodState] = useState<CalcMethod>("isna");
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(DEFAULT_COORDS);
  const [friends, setFriends] = useState<Friend[]>(SAMPLE_FRIENDS);
  const [streaks, setStreaks] = useState<StreakEntry[]>(getDefaultStreaks());
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [messages, setMessages] = useState<Record<string, Message[]>>(SEED_MESSAGES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [ob, usr, pm, rsvps, fr, st, ns, mthd, ml] = await Promise.all([
          AsyncStorage.getItem("onboardingComplete"),
          AsyncStorage.getItem("user"),
          AsyncStorage.getItem("primaryMasjid"),
          AsyncStorage.getItem("prayerRsvps"),
          AsyncStorage.getItem("friends"),
          AsyncStorage.getItem("streaks"),
          AsyncStorage.getItem("notificationSettings"),
          AsyncStorage.getItem("calcMethod"),
          AsyncStorage.getItem("masjidList"),
        ]);
        if (ob === "true") setOnboardingCompleteState(true);
        if (usr) setUser(JSON.parse(usr));
        if (pm) setPrimaryMasjidState(JSON.parse(pm));
        if (rsvps) setPrayerRsvps(JSON.parse(rsvps));
        if (fr) setFriends(JSON.parse(fr));
        if (st) setStreaks(JSON.parse(st));
        if (ns) setNotificationSettings(JSON.parse(ns));
        if (mthd) setCalcMethodState(mthd as CalcMethod);
        if (ml) setMasjidList(JSON.parse(ml));
      } catch (e) {
        if (__DEV__) console.warn("[AppContext] Failed to load persisted state:", e);
      }
      setIsLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return;
    let sub: Location.LocationSubscription | undefined;

    async function setupLocation() {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== "granted") return;

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        const initial = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        setCoords(initial);

        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Low, distanceInterval: 5000, timeInterval: 300_000 },
          (position) => {
            const newLat = position.coords.latitude;
            const newLng = position.coords.longitude;
            setCoords((prev) => {
              const dLat = (newLat - prev.lat) * (Math.PI / 180);
              const dLng = (newLng - prev.lng) * (Math.PI / 180);
              const a =
                Math.sin(dLat / 2) ** 2 +
                Math.cos(prev.lat * (Math.PI / 180)) *
                  Math.cos(newLat * (Math.PI / 180)) *
                  Math.sin(dLng / 2) ** 2;
              const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              if (dist > 5) {
                const Alert = require("react-native").Alert;
                Alert.alert(
                  "You've Moved",
                  "Looks like you're in a new area. Would you like to find a masjid nearby?",
                  [
                    { text: "Not Now", style: "cancel" },
                    {
                      text: "Find Masjid",
                      onPress: () => {
                        const router = require("expo-router").router;
                        router.push("/masjid-select");
                      },
                    },
                  ]
                );
                return { lat: newLat, lng: newLng };
              }
              return prev;
            });
          }
        );
      } catch (e) {
        if (__DEV__) console.warn("[AppContext] Location setup failed:", e);
      }
    }

    setupLocation();
    return () => { sub?.remove(); };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const masjid = primaryMasjid
      ? masjidList.find((m) => m.id === primaryMasjid.id) ?? primaryMasjid
      : null;
    const computed = buildPrayerTimes(coords, calcMethod, masjid ?? null, prayerRsvps);
    setPrayerTimes(computed);
  }, [coords, calcMethod, primaryMasjid, masjidList, prayerRsvps, isLoading]);

  useEffect(() => {
    if (Platform.OS === "web" || prayerTimes.length === 0) return;
    setupNotificationChannel().catch((e) => {
      if (__DEV__) console.warn("[AppContext] Notification channel setup failed:", e);
    });
    scheduleAllPrayerNotifications(prayerTimes, notificationSettings).catch((e) => {
      if (__DEV__) console.warn("[AppContext] Notification scheduling failed:", e);
    });
  }, [prayerTimes, notificationSettings]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setPrayerTimes((prev) =>
        prev.map((p) => {
          const adhanTime = new Date(p.adhanDate);
          const completed =
            !isNaN(adhanTime.getTime()) &&
            adhanTime < new Date(now.getTime() - 15 * 60_000);
          return p.completed !== completed ? { ...p, completed } : p;
        })
      );
    };
    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, []);

  const setOnboardingComplete = useCallback((v: boolean) => {
    setOnboardingCompleteState(v);
    AsyncStorage.setItem("onboardingComplete", v ? "true" : "false");
  }, []);

  const setPrimaryMasjid = useCallback((m: Masjid) => {
    setPrimaryMasjidState(m);
    AsyncStorage.setItem("primaryMasjid", JSON.stringify(m));
    setMasjidList((prev) =>
      prev.map((entry) => (entry.id === m.id ? { ...entry, ...m } : entry))
    );
  }, []);

  const setCalcMethod = useCallback((method: CalcMethod) => {
    setCalcMethodState(method);
    AsyncStorage.setItem("calcMethod", method);
  }, []);

  const updateRSVP = useCallback((prayer: Prayer, status: RSVPStatus) => {
    setPrayerRsvps((prev) => {
      const updated = { ...prev, [prayer]: status };
      AsyncStorage.setItem("prayerRsvps", JSON.stringify(updated));
      return updated;
    });
    setPrayerTimes((prev) =>
      prev.map((p) => (p.prayer === prayer ? { ...p, rsvp: status } : p))
    );
  }, []);

  const addFriend = useCallback((friend: Friend) => {
    setFriends((prev) => {
      const updated = [...prev, friend];
      AsyncStorage.setItem("friends", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFriend = useCallback((id: string) => {
    setFriends((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      AsyncStorage.setItem("friends", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markPrayerAttended = useCallback((prayer: Prayer) => {
    const today = new Date().toDateString();
    setStreaks((prev) => {
      const updated = prev.map((s) => {
        if (s.prayer !== prayer) return s;
        if (s.lastDate === today) return s;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const newCount = s.lastDate === yesterday.toDateString() ? s.count + 1 : 1;
        return { ...s, count: newCount, lastDate: today };
      });
      AsyncStorage.setItem("streaks", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const attendanceCreditedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const today = new Date().toDateString();
    for (const p of prayerTimes) {
      const key = `${today}_${p.prayer}`;
      if (p.completed && prayerRsvps[p.prayer] === "going" && !attendanceCreditedRef.current.has(key)) {
        attendanceCreditedRef.current.add(key);
        markPrayerAttended(p.prayer);
      }
    }
  }, [prayerTimes, prayerRsvps, markPrayerAttended]);

  const updateNotificationSettings = useCallback((s: Partial<NotificationSettings>) => {
    setNotificationSettings((prev) => {
      const updated = { ...prev, ...s };
      AsyncStorage.setItem("notificationSettings", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const sendMessage = useCallback((chatId: string, text: string) => {
    const msg: Message = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      senderId: user?.id ?? "me",
      text,
      timestamp: Date.now(),
    };
    setMessages((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] ?? []), msg],
    }));
  }, [user]);

  const updateUser = useCallback((updates: Partial<AppUser>) => {
    setUser((prev) => {
      const updated = prev
        ? { ...prev, ...updates }
        : ({
            id: "user1",
            name: "",
            username: "",
            primaryMasjidId: null,
            occasionalMasjidIds: [],
            isAdmin: false,
            adminMasjidIds: [],
            ...updates,
          } as AppUser);
      AsyncStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addOccasionalMasjid = useCallback((masjidId: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      if (prev.occasionalMasjidIds.includes(masjidId)) return prev;
      const updated = { ...prev, occasionalMasjidIds: [...prev.occasionalMasjidIds, masjidId] };
      AsyncStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeOccasionalMasjid = useCallback((masjidId: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, occasionalMasjidIds: prev.occasionalMasjidIds.filter((id) => id !== masjidId) };
      AsyncStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const occasionalMasjids = useMemo(
    () => (user?.occasionalMasjidIds ?? []).map((id) => masjidList.find((m) => m.id === id)).filter(Boolean) as Masjid[],
    [user?.occasionalMasjidIds, masjidList]
  );

  const setPendingRSVP = useCallback((prayer: Prayer) => {
    setPendingRSVPState(prayer);
  }, []);

  const clearPendingRSVP = useCallback(() => {
    setPendingRSVPState(null);
  }, []);

  const updateMasjidTimes = useCallback(
    (masjidId: string, overrides: Partial<Record<Prayer, MasjidTimeOverride>>) => {
      setMasjidList((prev) => {
        const updated = prev.map((m) =>
          m.id === masjidId ? { ...m, timeOverrides: { ...m.timeOverrides, ...overrides } } : m
        );
        AsyncStorage.setItem("masjidList", JSON.stringify(updated));
        return updated;
      });
      if (primaryMasjid?.id === masjidId) {
        setPrimaryMasjidState((prev) =>
          prev ? { ...prev, timeOverrides: { ...prev.timeOverrides, ...overrides } } : prev
        );
      }
    },
    [primaryMasjid]
  );

  const friendRSVPs = useMemo<Record<string, Partial<Record<Prayer, Friend[]>>>>(() => {
    return {
      [primaryMasjid?.id ?? "m1"]: {
        fajr: [friends[0], friends[1]].filter(Boolean),
        dhuhr: [friends[0]].filter(Boolean),
        jummah: [friends[0], friends[1], friends[2]].filter(Boolean),
        asr: [],
        maghrib: [friends[1], friends[2]].filter(Boolean),
        isha: [friends[0]].filter(Boolean),
      },
    };
  }, [primaryMasjid, friends]);

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      onboardingComplete,
      setOnboardingComplete,
      primaryMasjid,
      setPrimaryMasjid,
      nearbyMasjids: masjidList,
      prayerTimes,
      updateRSVP,
      calcMethod,
      setCalcMethod,
      friends,
      addFriend,
      removeFriend,
      streaks,
      markPrayerAttended,
      notificationSettings,
      updateNotificationSettings,
      messages,
      sendMessage,
      updateUser,
      friendRSVPs,
      updateMasjidTimes,
      pendingRSVP,
      setPendingRSVP,
      clearPendingRSVP,
      coords,
      occasionalMasjids,
      addOccasionalMasjid,
      removeOccasionalMasjid,
    }),
    [
      user,
      onboardingComplete,
      setOnboardingComplete,
      primaryMasjid,
      setPrimaryMasjid,
      masjidList,
      prayerTimes,
      updateRSVP,
      calcMethod,
      setCalcMethod,
      friends,
      addFriend,
      removeFriend,
      streaks,
      markPrayerAttended,
      notificationSettings,
      updateNotificationSettings,
      messages,
      sendMessage,
      updateUser,
      friendRSVPs,
      updateMasjidTimes,
      pendingRSVP,
      setPendingRSVP,
      clearPendingRSVP,
      coords,
      occasionalMasjids,
      addOccasionalMasjid,
      removeOccasionalMasjid,
    ]
  );

  if (isLoading) return null;

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
