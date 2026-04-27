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
import { Alert, Platform } from "react-native";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalcMethod, computePrayerTimes, formatIqamah } from "@/utils/prayerTimes";
import { scheduleAllPrayerNotifications, scheduleStreakReminderNotification, setupNotificationChannel } from "@/utils/notifications";
import { api, setApiBaseUrl, getAuthToken, saveAuthCredentials } from "./api";

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
  website?: string;
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
  loadMessages: (partnerId: string) => Promise<void>;
  updateUser: (updates: Partial<AppUser>) => void;
  onRegistered: (authToken: string) => void;
  friendRSVPs: Record<string, Partial<Record<Prayer, Friend[]>>>;
  updateMasjidTimes: (masjidId: string, overrides: Partial<Record<Prayer, MasjidTimeOverride>>) => void;
  pendingRSVP: Prayer | null;
  clearPendingRSVP: () => void;
  setPendingRSVP: (prayer: Prayer) => void;
  coords: { lat: number; lng: number };
  requestLocation: () => Promise<"granted" | "denied">;
  occasionalMasjids: Masjid[];
  addOccasionalMasjid: (masjidId: string) => void;
  removeOccasionalMasjid: (masjidId: string) => void;
  claimMasjid: (masjidId: string) => void;
}

const DEFAULT_COORDS = { lat: 40.7128, lng: -74.006 };


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

function getApiBaseUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}`;
  return "";
}

function getWsBaseUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `wss://${domain}`;
  return "ws://localhost";
}

function todayIso() {
  return new Date().toISOString().split("T")[0];
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const [onboardingComplete, setOnboardingCompleteState] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [primaryMasjid, setPrimaryMasjidState] = useState<Masjid | null>(null);
  const [masjidList, setMasjidList] = useState<Masjid[]>([]);
  const lastFetchedCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [prayerRsvps, setPrayerRsvps] = useState<Partial<Record<Prayer, RSVPStatus>>>({});
  const [pendingRSVP, setPendingRSVPState] = useState<Prayer | null>(null);
  const [calcMethod, setCalcMethodState] = useState<CalcMethod>("isna");
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(DEFAULT_COORDS);
  const [currentDate, setCurrentDate] = useState(() => new Date().toDateString());
  const [localFriends, setLocalFriends] = useState<Friend[]>(SAMPLE_FRIENDS);
  const [streaks, setStreaks] = useState<StreakEntry[]>(getDefaultStreaks());
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [messages, setMessages] = useState<Record<string, Message[]>>(SEED_MESSAGES);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAuthToken, setHasAuthToken] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const wsRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoFetchedRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    setApiBaseUrl(getApiBaseUrl());
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [ob, usr, pm, rsvps, fr, st, ns, mthd, ml, token] = await Promise.all([
          AsyncStorage.getItem("onboardingComplete"),
          AsyncStorage.getItem("user"),
          AsyncStorage.getItem("primaryMasjid"),
          AsyncStorage.getItem("prayerRsvps"),
          AsyncStorage.getItem("friends"),
          AsyncStorage.getItem("streaks"),
          AsyncStorage.getItem("notificationSettings"),
          AsyncStorage.getItem("calcMethod"),
          AsyncStorage.getItem("masjidList"),
          AsyncStorage.getItem("authToken"),
        ]);
        if (ob === "true") setOnboardingCompleteState(true);
        if (usr) setUser(JSON.parse(usr));
        if (pm) setPrimaryMasjidState(JSON.parse(pm));
        if (rsvps) setPrayerRsvps(JSON.parse(rsvps));
        if (fr) setLocalFriends(JSON.parse(fr));
        if (st) setStreaks(JSON.parse(st));
        if (ns) setNotificationSettings(JSON.parse(ns));
        if (mthd) setCalcMethodState(mthd as CalcMethod);
        if (ml) setMasjidList(JSON.parse(ml));
        if (token) setHasAuthToken(true);
      } catch (e) {
        if (__DEV__) console.warn("[AppContext] Failed to load persisted state:", e);
      }
      setIsLoading(false);
    }
    load();
  }, []);

  const friendsQuery = useQuery({
    queryKey: ["friends"],
    queryFn: async () => {
      const token = await getAuthToken();
      if (!token) return null;
      return api.friends.list();
    },
    enabled: !isLoading && hasAuthToken,
    staleTime: 60_000,
  });

  const rsvpsQuery = useQuery({
    queryKey: ["rsvps", todayIso()],
    queryFn: async () => {
      const token = await getAuthToken();
      if (!token) return null;
      return api.rsvps.mine();
    },
    enabled: !isLoading && hasAuthToken,
    staleTime: 30_000,
  });

  const masjidId = primaryMasjid?.id;
  const friendRsvpsQuery = useQuery({
    queryKey: ["friendRsvps", masjidId],
    queryFn: async () => {
      const token = await getAuthToken();
      if (!token) return null;
      return api.rsvps.friends(undefined, masjidId);
    },
    enabled: !isLoading && hasAuthToken,
    refetchInterval: 30_000,
    staleTime: 25_000,
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ prayer, status }: { prayer: Prayer; status: RSVPStatus }) => {
      const token = await getAuthToken();
      if (!token) return;
      if (status === null) {
        await api.rsvps.clear(prayer);
      } else {
        await api.rsvps.update(prayer, status, masjidId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rsvps"] });
      queryClient.invalidateQueries({ queryKey: ["friendRsvps"] });
    },
  });

  const addFriendMutation = useMutation({
    mutationFn: async (username: string) => {
      const token = await getAuthToken();
      if (!token) return null;
      return api.friends.add(username);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      const token = await getAuthToken();
      if (!token) return;
      await api.friends.remove(friendId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ partnerId, text }: { partnerId: string; text: string }) => {
      const token = await getAuthToken();
      if (!token) return null;
      return api.messages.send(partnerId, text);
    },
  });

  useEffect(() => {
    if (friendsQuery.isSuccess && friendsQuery.data?.friends) {
      const apiFriends = friendsQuery.data.friends;
      setLocalFriends(apiFriends);
      AsyncStorage.setItem("friends", JSON.stringify(apiFriends));
    }
  }, [friendsQuery.isSuccess, friendsQuery.data]);

  useEffect(() => {
    if (rsvpsQuery.isSuccess && rsvpsQuery.data) {
      const apiRsvps: Partial<Record<Prayer, RSVPStatus>> = {};
      for (const [prayer, status] of Object.entries(rsvpsQuery.data.rsvps ?? {})) {
        apiRsvps[prayer as Prayer] = status as RSVPStatus;
      }
      setPrayerRsvps(apiRsvps);
      AsyncStorage.setItem("prayerRsvps", JSON.stringify(apiRsvps));
    }
  }, [rsvpsQuery.isSuccess, rsvpsQuery.data]);

  const connectWebSocket = useCallback((token: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = `${getWsBaseUrl()}/ws?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (__DEV__) console.log("[WS] Connected");
      if (wsRetryRef.current) {
        clearTimeout(wsRetryRef.current);
        wsRetryRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);
        if (data.type === "rsvp_update") {
          queryClient.invalidateQueries({ queryKey: ["friendRsvps"] });
        } else if (data.type === "new_message" && data.senderId) {
          const chatId = `dm_${data.senderId}`;
          const msg: Message = {
            id: data.message.id,
            senderId: data.message.senderId,
            text: data.message.text,
            timestamp: data.message.timestamp,
          };
          setMessages((prev) => {
            const existing = prev[chatId] ?? [];
            if (existing.some((m) => m.id === msg.id)) return prev;
            return { ...prev, [chatId]: [...existing, msg] };
          });
        }
      } catch (e) {
        if (__DEV__) console.warn("[WS] Message parse error:", e);
      }
    };

    ws.onclose = () => {
      if (__DEV__) console.log("[WS] Disconnected, reconnecting in 5s");
      wsRetryRef.current = setTimeout(() => connectWebSocket(token), 5_000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [queryClient]);

  useEffect(() => {
    if (!hasAuthToken || isLoading) return;
    getAuthToken().then((token) => {
      if (token) connectWebSocket(token);
    });
    return () => {
      wsRef.current?.close();
      if (wsRetryRef.current) clearTimeout(wsRetryRef.current);
    };
  }, [hasAuthToken, isLoading, connectWebSocket]);

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
                Alert.alert(
                  "You've Moved",
                  "Looks like you're in a new area. Would you like to find a masjid nearby?",
                  [
                    { text: "Not Now", style: "cancel" },
                    {
                      text: "Find Masjid",
                      onPress: () => router.push("/masjid-select"),
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

  const requestLocation = useCallback(async (): Promise<"granted" | "denied"> => {
    if (Platform.OS === "web") {
      return new Promise((resolve) => {
        if (!navigator.geolocation) { resolve("denied"); return; }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            resolve("granted");
          },
          () => resolve("denied"),
          { timeout: 10000, enableHighAccuracy: false }
        );
      });
    }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return "denied";
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      return "granted";
    } catch {
      return "denied";
    }
  }, []);

  useEffect(() => {
    const DEFAULT_LAT = 40.7128;
    const DEFAULT_LNG = -74.006;
    const isDefaultCoords =
      Math.abs(coords.lat - DEFAULT_LAT) < 0.01 &&
      Math.abs(coords.lng - DEFAULT_LNG) < 0.01;
    if (isDefaultCoords) return;

    const prev = lastFetchedCoordsRef.current;
    if (prev) {
      const dLat = (coords.lat - prev.lat) * (Math.PI / 180);
      const dLng = (coords.lng - prev.lng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(prev.lat * (Math.PI / 180)) *
          Math.cos(coords.lat * (Math.PI / 180)) *
          Math.sin(dLng / 2) ** 2;
      const km = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (km < 2) return;
    }

    lastFetchedCoordsRef.current = coords;

    api.masjids
      .nearby(coords.lat, coords.lng)
      .then(({ masjids }) => {
        if (!masjids || masjids.length === 0) return;
        setMasjidList(masjids as Masjid[]);
        AsyncStorage.setItem("masjidList", JSON.stringify(masjids)).catch(() => {});
      })
      .catch((e) => {
        if (__DEV__) console.warn("[AppContext] Nearby masjid fetch failed:", e);
      });
  }, [coords]);

  useEffect(() => {
    if (isLoading) return;
    const masjid = primaryMasjid
      ? masjidList.find((m) => m.id === primaryMasjid.id) ?? primaryMasjid
      : null;
    const computed = buildPrayerTimes(coords, calcMethod, masjid ?? null, prayerRsvps);
    setPrayerTimes(computed);
  }, [coords, calcMethod, primaryMasjid, masjidList, prayerRsvps, isLoading, currentDate]);

  useEffect(() => {
    if (isLoading || !primaryMasjid) return;
    const masjid = masjidList.find((m) => m.id === primaryMasjid.id) ?? primaryMasjid;
    const hasCoords = typeof masjid.lat === "number" && typeof masjid.lng === "number";
    if (!hasCoords && !masjid.website) return;

    const today = todayIso();
    const lastFetched = autoFetchedRef.current.get(masjid.id);
    if (lastFetched === today) return;
    autoFetchedRef.current.set(masjid.id, today);

    api.masjids
      .fetchTimes({
        url: masjid.website || undefined,
        lat: masjid.lat,
        lng: masjid.lng,
        method: calcMethod,
      })
      .then(({ overrides }) => {
        const prayers = Object.keys(overrides) as Prayer[];
        if (prayers.length === 0) return;
        const typed: Partial<Record<Prayer, MasjidTimeOverride>> = {};
        for (const p of prayers) {
          const v = overrides[p];
          if (v && v.adhan && v.iqamah) typed[p] = { adhan: v.adhan, iqamah: v.iqamah };
        }
        setMasjidList((prev) => {
          const updated = prev.map((m) =>
            m.id === masjid.id
              ? { ...m, timeOverrides: { ...m.timeOverrides, ...typed } }
              : m
          );
          AsyncStorage.setItem("masjidList", JSON.stringify(updated));
          return updated;
        });
        setPrimaryMasjidState((prev) =>
          prev?.id === masjid.id
            ? { ...prev, timeOverrides: { ...prev.timeOverrides, ...typed } }
            : prev
        );
      })
      .catch(() => {});
  }, [primaryMasjid?.id, calcMethod, isLoading]);

  useEffect(() => {
    if (Platform.OS === "web" || prayerTimes.length === 0) return;
    setupNotificationChannel().catch(() => {});
    scheduleAllPrayerNotifications(prayerTimes, notificationSettings).catch(() => {});
    const ishaEntry = prayerTimes.find((p) => p.prayer === "isha");
    if (ishaEntry) {
      const currentStreak = streaks.reduce((max, s) => Math.max(max, s.count), 0);
      scheduleStreakReminderNotification(currentStreak, notificationSettings, ishaEntry.adhan).catch(() => {});
    }
  }, [prayerTimes, notificationSettings, streaks]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const todayStr = now.toDateString();
      setCurrentDate((prev) => {
        if (prev !== todayStr) return todayStr;
        return prev;
      });
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
    rsvpMutation.mutate({ prayer, status });
  }, [rsvpMutation]);

  const addFriend = useCallback((friend: Friend) => {
    if (!hasAuthToken) {
      setLocalFriends((prev) => {
        if (prev.some((f) => f.id === friend.id)) return prev;
        const updated = [...prev, friend];
        AsyncStorage.setItem("friends", JSON.stringify(updated));
        return updated;
      });
      return;
    }
    addFriendMutation.mutate(friend.username, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["friends"] });
      },
      onError: (e) => {
        const msg = e instanceof Error ? e.message : "Could not add friend. Please try again.";
        Alert.alert("Add Friend Failed", msg);
      },
    });
  }, [hasAuthToken, addFriendMutation, queryClient]);

  const removeFriend = useCallback((id: string) => {
    if (!hasAuthToken) {
      setLocalFriends((prev) => {
        const updated = prev.filter((f) => f.id !== id);
        AsyncStorage.setItem("friends", JSON.stringify(updated));
        return updated;
      });
      return;
    }
    removeFriendMutation.mutate(id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["friends"] });
      },
    });
  }, [hasAuthToken, removeFriendMutation, queryClient]);

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
    const localMsg: Message = {
      id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      senderId: user?.id ?? "me",
      text,
      timestamp: Date.now(),
    };
    setMessages((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] ?? []), localMsg],
    }));
    const partnerId = chatId.startsWith("dm_") ? chatId.slice(3) : chatId;
    sendMessageMutation.mutate(
      { partnerId, text },
      {
        onSuccess: (data) => {
          if (!data?.message) return;
          const serverMsg = data.message;
          setMessages((prev) => {
            const existing = prev[chatId] ?? [];
            const deduped = existing.filter((m) => m.id !== localMsg.id);
            if (deduped.some((m) => m.id === serverMsg.id)) return prev;
            return { ...prev, [chatId]: [...deduped, serverMsg] };
          });
        },
      }
    );
  }, [user, sendMessageMutation]);

  const loadMessages = useCallback(async (partnerId: string) => {
    const token = await getAuthToken();
    if (!token) return;
    try {
      const res = await api.messages.get(partnerId);
      if (res.messages.length > 0) {
        const chatId = `dm_${partnerId}`;
        setMessages((prev) => {
          const existing = (prev[chatId] ?? []).filter((m) => !m.id.startsWith("local_"));
          const existingIds = new Set(existing.map((m) => m.id));
          const incoming = res.messages.filter((m) => !existingIds.has(m.id));
          if (incoming.length === 0) return prev;
          const merged = [...existing, ...incoming].sort((a, b) => a.timestamp - b.timestamp);
          return { ...prev, [chatId]: merged };
        });
      }
    } catch (e) {
      if (__DEV__) console.warn("[AppContext] Load messages failed:", e);
    }
  }, []);

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

  const onRegistered = useCallback((authToken: string) => {
    setHasAuthToken(true);
    connectWebSocket(authToken);
    queryClient.invalidateQueries({ queryKey: ["friends"] });
    queryClient.invalidateQueries({ queryKey: ["rsvps"] });
    queryClient.invalidateQueries({ queryKey: ["friendRsvps"] });
  }, [connectWebSocket, queryClient]);

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

  const claimMasjid = useCallback((masjidId: string) => {
    setMasjidList((prev) => {
      const updated = prev.map((m) => (m.id === masjidId ? { ...m, claimed: true } : m));
      AsyncStorage.setItem("masjidList", JSON.stringify(updated));
      return updated;
    });
    setPrimaryMasjidState((prev) =>
      prev?.id === masjidId ? { ...prev, claimed: true } : prev
    );
  }, []);

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

  const friends = useMemo<Friend[]>(() => {
    if (hasAuthToken && friendsQuery.isSuccess) {
      return (friendsQuery.data?.friends ?? []) as Friend[];
    }
    return localFriends;
  }, [hasAuthToken, friendsQuery.isSuccess, friendsQuery.data, localFriends]);

  const friendRSVPs = useMemo<Record<string, Partial<Record<Prayer, Friend[]>>>>(() => {
    const masjidKey = primaryMasjid?.id ?? "m1";
    if (hasAuthToken && friendRsvpsQuery.isSuccess) {
      const apiData = (friendRsvpsQuery.data?.friendRsvps ?? {}) as Partial<Record<Prayer, Friend[]>>;
      return { [masjidKey]: apiData };
    }
    if (!hasAuthToken) {
      return {
        [masjidKey]: {
          fajr: [localFriends[0], localFriends[1]].filter(Boolean),
          dhuhr: [localFriends[0]].filter(Boolean),
          jummah: [localFriends[0], localFriends[1], localFriends[2]].filter(Boolean),
          asr: [],
          maghrib: [localFriends[1], localFriends[2]].filter(Boolean),
          isha: [localFriends[0]].filter(Boolean),
        },
      };
    }
    return { [masjidKey]: {} };
  }, [hasAuthToken, primaryMasjid, localFriends, friendRsvpsQuery.isSuccess, friendRsvpsQuery.data]);

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
      loadMessages,
      updateUser,
      onRegistered,
      friendRSVPs,
      updateMasjidTimes,
      pendingRSVP,
      setPendingRSVP,
      clearPendingRSVP,
      coords,
      requestLocation,
      occasionalMasjids,
      addOccasionalMasjid,
      removeOccasionalMasjid,
      claimMasjid,
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
      loadMessages,
      updateUser,
      onRegistered,
      friendRSVPs,
      updateMasjidTimes,
      pendingRSVP,
      setPendingRSVP,
      clearPendingRSVP,
      coords,
      requestLocation,
      occasionalMasjids,
      addOccasionalMasjid,
      removeOccasionalMasjid,
      claimMasjid,
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
