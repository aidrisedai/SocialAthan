import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Prayer = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha" | "jummah";

export type RSVPStatus = "going" | "maybe" | "cant" | null;

export interface PrayerTime {
  prayer: Prayer;
  label: string;
  adhan: string;
  iqamah: string;
  rsvp: RSVPStatus;
  completed: boolean;
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
  adhanTimes?: Partial<Record<Prayer, string>>;
  iqamahTimes?: Partial<Record<Prayer, string>>;
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
  friendRSVPs: boolean;
  encouragements: boolean;
  nudges: boolean;
  streakReminders: boolean;
  perPrayer: Record<Prayer, boolean>;
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
  friendRSVPs: Record<string, Record<Prayer, Friend[]>>;
}

const PRAYERS_OF_DAY: Prayer[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

function getDefaultPrayerTimes(): PrayerTime[] {
  const now = new Date();
  const isJummuah = now.getDay() === 5;
  const base: Array<{ prayer: Prayer; label: string; adhan: string; iqamah: string }> = [
    { prayer: "fajr", label: "Fajr", adhan: "5:22 AM", iqamah: "5:40 AM" },
    {
      prayer: isJummuah ? "jummah" : "dhuhr",
      label: isJummuah ? "Jumu'ah" : "Dhuhr",
      adhan: isJummuah ? "1:00 PM" : "12:48 PM",
      iqamah: isJummuah ? "1:30 PM" : "1:05 PM",
    },
    { prayer: "asr", label: "Asr", adhan: "4:17 PM", iqamah: "4:30 PM" },
    { prayer: "maghrib", label: "Maghrib", adhan: "7:41 PM", iqamah: "7:48 PM" },
    { prayer: "isha", label: "Isha", adhan: "9:10 PM", iqamah: "9:25 PM" },
  ];

  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return base.map(({ prayer, label, adhan, iqamah }) => {
    const [time, period] = adhan.split(" ");
    const [h, m] = time.split(":").map(Number);
    const minutes = ((period === "PM" && h !== 12) ? h + 12 : (period === "AM" && h === 12) ? 0 : h) * 60 + m;
    return {
      prayer,
      label,
      adhan,
      iqamah,
      rsvp: null,
      completed: nowMinutes > minutes + 15,
    };
  });
}

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

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  masterEnabled: true,
  adhan: true,
  iqamah: true,
  friendRSVPs: true,
  encouragements: true,
  nudges: true,
  streakReminders: true,
  perPrayer: {
    fajr: true,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
    jummah: true,
  },
};

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
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>(getDefaultPrayerTimes());
  const [friends, setFriends] = useState<Friend[]>(SAMPLE_FRIENDS);
  const [streaks, setStreaks] = useState<StreakEntry[]>(getDefaultStreaks());
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const friendRSVPs = useMemo<Record<string, Record<Prayer, Friend[]>>>(() => {
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

  useEffect(() => {
    async function load() {
      try {
        const [ob, usr, pm, pt, fr, st, ns] = await Promise.all([
          AsyncStorage.getItem("onboardingComplete"),
          AsyncStorage.getItem("user"),
          AsyncStorage.getItem("primaryMasjid"),
          AsyncStorage.getItem("prayerTimes"),
          AsyncStorage.getItem("friends"),
          AsyncStorage.getItem("streaks"),
          AsyncStorage.getItem("notificationSettings"),
        ]);
        if (ob === "true") setOnboardingCompleteState(true);
        if (usr) setUser(JSON.parse(usr));
        if (pm) setPrimaryMasjidState(JSON.parse(pm));
        if (pt) setPrayerTimes(JSON.parse(pt));
        if (fr) setFriends(JSON.parse(fr));
        if (st) setStreaks(JSON.parse(st));
        if (ns) setNotificationSettings(JSON.parse(ns));
      } catch {}
      setIsLoading(false);
    }
    load();
  }, []);

  const setOnboardingComplete = useCallback((v: boolean) => {
    setOnboardingCompleteState(v);
    AsyncStorage.setItem("onboardingComplete", v ? "true" : "false");
  }, []);

  const setPrimaryMasjid = useCallback((m: Masjid) => {
    setPrimaryMasjidState(m);
    AsyncStorage.setItem("primaryMasjid", JSON.stringify(m));
  }, []);

  const updateRSVP = useCallback((prayer: Prayer, status: RSVPStatus) => {
    setPrayerTimes((prev) => {
      const updated = prev.map((p) =>
        p.prayer === prayer ? { ...p, rsvp: status } : p
      );
      AsyncStorage.setItem("prayerTimes", JSON.stringify(updated));
      return updated;
    });
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

  const updateNotificationSettings = useCallback((s: Partial<NotificationSettings>) => {
    setNotificationSettings((prev) => {
      const updated = { ...prev, ...s };
      AsyncStorage.setItem("notificationSettings", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const sendMessage = useCallback((chatId: string, text: string) => {
    const msg: Message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
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
      const updated = prev ? { ...prev, ...updates } : ({
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

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      onboardingComplete,
      setOnboardingComplete,
      primaryMasjid,
      setPrimaryMasjid,
      nearbyMasjids: NEARBY_MASJIDS,
      prayerTimes,
      updateRSVP,
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
    }),
    [
      user,
      onboardingComplete,
      setOnboardingComplete,
      primaryMasjid,
      setPrimaryMasjid,
      prayerTimes,
      updateRSVP,
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
