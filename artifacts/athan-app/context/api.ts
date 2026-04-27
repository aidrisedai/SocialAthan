import AsyncStorage from "@react-native-async-storage/async-storage";

const API_TOKEN_KEY = "authToken";
const API_USER_ID_KEY = "apiUserId";

let _baseUrl: string | null = null;
let _cachedToken: string | null = null;

export function setApiBaseUrl(url: string) {
  _baseUrl = url;
}

export async function getAuthToken(): Promise<string | null> {
  if (_cachedToken) return _cachedToken;
  _cachedToken = await AsyncStorage.getItem(API_TOKEN_KEY);
  return _cachedToken;
}

export async function saveAuthCredentials(token: string, userId: string) {
  _cachedToken = token;
  await Promise.all([
    AsyncStorage.setItem(API_TOKEN_KEY, token),
    AsyncStorage.setItem(API_USER_ID_KEY, userId),
  ]);
}

export async function clearAuthCredentials() {
  _cachedToken = null;
  await Promise.all([
    AsyncStorage.removeItem(API_TOKEN_KEY),
    AsyncStorage.removeItem(API_USER_ID_KEY),
  ]);
}

export async function getSavedUserId(): Promise<string | null> {
  return AsyncStorage.getItem(API_USER_ID_KEY);
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const base = _baseUrl ?? "";
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${base}/api${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body?.error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export interface ApiUser {
  id: string;
  name: string;
  username: string;
}

export interface ApiFriend {
  id: string;
  name: string;
  username: string;
  isConnected: boolean;
}

export interface ApiMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export const api = {
  auth: {
    register: (name: string, username: string) =>
      apiFetch<{ user: ApiUser; authToken: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, username }),
      }),
    me: () => apiFetch<{ user: ApiUser }>("/auth/me"),
  },
  friends: {
    list: () => apiFetch<{ friends: ApiFriend[] }>("/friends"),
    add: (username: string) =>
      apiFetch<{ friend: ApiFriend }>("/friends", {
        method: "POST",
        body: JSON.stringify({ username }),
      }),
    remove: (friendId: string) =>
      apiFetch<{ success: boolean }>(`/friends/${friendId}`, { method: "DELETE" }),
  },
  rsvps: {
    mine: (date?: string) =>
      apiFetch<{ rsvps: Record<string, string>; date: string }>(
        `/rsvps${date ? `?date=${date}` : ""}`
      ),
    update: (prayer: string, status: string, masjidId?: string) =>
      apiFetch<{ success: boolean }>(`/rsvps/${prayer}`, {
        method: "PUT",
        body: JSON.stringify({ status, masjidId }),
      }),
    clear: (prayer: string) =>
      apiFetch<{ success: boolean }>(`/rsvps/${prayer}`, { method: "DELETE" }),
    friends: (date?: string, masjidId?: string) => {
      const params = new URLSearchParams();
      if (date) params.set("date", date);
      if (masjidId) params.set("masjidId", masjidId);
      const qs = params.toString();
      return apiFetch<{ friendRsvps: Record<string, ApiFriend[]>; date: string }>(
        `/rsvps/friends${qs ? `?${qs}` : ""}`
      );
    },
  },
  messages: {
    get: (partnerId: string, limit = 100) =>
      apiFetch<{ messages: ApiMessage[] }>(`/messages/${partnerId}?limit=${limit}`),
    send: (partnerId: string, text: string) =>
      apiFetch<{ message: ApiMessage }>(`/messages/${partnerId}`, {
        method: "POST",
        body: JSON.stringify({ text }),
      }),
  },
  users: {
    byUsername: (username: string) =>
      apiFetch<{ user: ApiUser }>(`/users/by-username/${username}`),
  },
  masjids: {
    nearby: (lat: number, lng: number, radiusMeters = 10000) =>
      apiFetch<{ masjids: unknown[] }>(
        `/masjids/nearby?lat=${lat}&lng=${lng}&radius=${radiusMeters}`
      ),
    fetchTimes: (params: {
      url?: string;
      lat?: number;
      lng?: number;
      method?: string;
    }) =>
      apiFetch<{
        overrides: Partial<Record<string, { adhan?: string; iqamah?: string }>>;
        sources?: { website: boolean; aladhan: boolean };
      }>("/masjids/fetch-times", {
        method: "POST",
        body: JSON.stringify(params),
      }),
  },
};
