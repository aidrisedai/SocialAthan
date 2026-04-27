import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import type { Href } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { ComponentProps } from "react";
import { useColors } from "@/hooks/useColors";
import { useApp, Friend } from "@/context/AppContext";
import { api, getAuthToken } from "@/context/api";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface ConnectOption {
  icon: IoniconName;
  label: string;
  sub: string;
  route: Href;
}

const CONNECT_OPTIONS: ConnectOption[] = [
  { icon: "people-outline", label: "Sync Contacts", sub: "Find friends already using the app", route: "/contact-sync" },
  { icon: "qr-code-outline", label: "QR Code", sub: "Scan someone's code at the masjid", route: "/qr-scan" },
  { icon: "link-outline", label: "Share Link", sub: "Invite via WhatsApp, SMS, or anywhere", route: "/invite-link" },
];

type SearchState = "idle" | "loading" | "found" | "not_found" | "error";

interface SearchResult {
  id: string;
  name: string;
  username: string;
  isConnected: boolean;
}

export default function FriendDiscoverScreen() {
  const colors = useColors();
  const { addFriend, friends } = useApp();
  const [query, setQuery] = useState("");
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getAuthToken().then((token) => {
      setIsAuthenticated(!!token);
    });
  }, []);

  const existingIds = new Set(friends.map((f) => f.id));

  const searchByUsername = useCallback(async (username: string) => {
    const trimmed = username.trim().toLowerCase().replace(/^@/, "");
    if (!trimmed || trimmed.length < 2) {
      setSearchState("idle");
      setSearchResult(null);
      return;
    }
    setSearchState("loading");
    try {
      const res = await api.users.byUsername(trimmed);
      const user = res.user;
      setSearchResult({
        id: user.id,
        name: user.name,
        username: user.username,
        isConnected: friends.some((f) => f.id === user.id),
      });
      setSearchState("found");
    } catch {
      setSearchState("not_found");
      setSearchResult(null);
    }
  }, [friends]);

  function handleQueryChange(text: string) {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setSearchState("idle");
      setSearchResult(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      if (isAuthenticated) {
        searchByUsername(text);
      }
    }, 400);
  }

  function handleAdd(user: SearchResult | Friend) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addFriend({ ...user, isConnected: true });
    setAddedIds((prev) => new Set([...prev, user.id]));
  }

  const queryIsActive = query.trim().length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Add Friends</Text>
        <View style={{ width: 24 }} />
      </View>

      <View
        style={[
          styles.searchContainer,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search by @username..."
          placeholderTextColor={colors.mutedForeground}
          value={query}
          onChangeText={handleQueryChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchState === "loading" && (
          <ActivityIndicator size="small" color={colors.primary} />
        )}
        {query.length > 0 && searchState !== "loading" && (
          <Pressable onPress={() => { setQuery(""); setSearchState("idle"); setSearchResult(null); }}>
            <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {queryIsActive && isAuthenticated && (
          <>
            {searchState === "found" && searchResult && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                  Result
                </Text>
                <UserRow
                  user={searchResult}
                  added={addedIds.has(searchResult.id) || existingIds.has(searchResult.id)}
                  onAdd={handleAdd}
                />
              </>
            )}
            {searchState === "not_found" && (
              <View style={styles.emptySearch}>
                <Ionicons name="person-outline" size={40} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  No user found for "{query.replace(/^@/, "")}"
                </Text>
                <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
                  Make sure you have the exact username
                </Text>
              </View>
            )}
          </>
        )}

        {queryIsActive && !isAuthenticated && (
          <View style={styles.emptySearch}>
            <Ionicons name="log-in-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Sign in to search for friends
            </Text>
          </View>
        )}

        {!queryIsActive && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              Ways to Connect
            </Text>
            {CONNECT_OPTIONS.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => router.push(item.route)}
                style={[
                  styles.discoverCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={[styles.iconCircle, { backgroundColor: colors.highlight }]}>
                  <Ionicons name={item.icon} size={22} color={colors.primary} />
                </View>
                <View style={styles.discoverText}>
                  <Text style={[styles.discoverLabel, { color: colors.foreground }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.discoverSub, { color: colors.mutedForeground }]}>
                    {item.sub}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              </Pressable>
            ))}

            {isAuthenticated && friends.length === 0 && (
              <View style={styles.emptySearch}>
                <Ionicons name="people-outline" size={40} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Search for a friend by their username above
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function UserRow({
  user,
  added,
  onAdd,
}: {
  user: { id: string; name: string; username: string; isConnected: boolean };
  added: boolean;
  onAdd: (u: { id: string; name: string; username: string; isConnected: boolean }) => void;
}) {
  const colors = useColors();
  return (
    <View
      style={[styles.userRow, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.avatarText, { color: colors.primary }]}>
          {user.name.charAt(0)}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.foreground }]}>{user.name}</Text>
        <Text style={[styles.userHandle, { color: colors.mutedForeground }]}>
          @{user.username}
        </Text>
      </View>
      <Pressable
        onPress={() => { if (!added) onAdd(user); }}
        disabled={added}
        style={[
          styles.addBtn,
          { backgroundColor: added ? colors.secondary : colors.primary },
        ]}
      >
        <Ionicons
          name={added ? "checkmark" : "add"}
          size={18}
          color={added ? colors.mutedForeground : colors.primaryForeground}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Lora_700Bold",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Lora_400Regular",
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Lora_600SemiBold",
    paddingHorizontal: 20,
    paddingBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  emptySearch: {
    paddingTop: 40,
    alignItems: "center",
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Lora_500Medium",
    textAlign: "center",
  },
  emptyHint: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
    textAlign: "center",
  },
  discoverCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  discoverText: {
    flex: 1,
    gap: 2,
  },
  discoverLabel: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Lora_600SemiBold",
  },
  discoverSub: {
    fontSize: 13,
    fontFamily: "Lora_400Regular",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Lora_700Bold",
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Lora_600SemiBold",
  },
  userHandle: {
    fontSize: 13,
    fontFamily: "Lora_400Regular",
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
});
