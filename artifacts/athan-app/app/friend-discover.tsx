import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import type { Href } from "expo-router";
import React, { useState } from "react";
import {
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

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface ConnectOption {
  icon: IoniconName;
  label: string;
  sub: string;
  route: Href;
}

const CONNECT_OPTIONS: ConnectOption[] = [
  { icon: "qr-code-outline", label: "QR Code", sub: "Scan someone's code at the masjid", route: "/qr-scan" },
  { icon: "link-outline", label: "Share Link", sub: "Invite via WhatsApp, SMS, or anywhere", route: "/invite-link" },
];

const SUGGESTED_USERS: Friend[] = [
  { id: "s1", name: "Khalid Rahman", username: "khalid_r", isConnected: false },
  { id: "s2", name: "Tariq Jamal", username: "tariq.j", isConnected: false },
  { id: "s3", name: "Bilal Siddiqui", username: "bilal_s", isConnected: false },
];

export default function FriendDiscoverScreen() {
  const colors = useColors();
  const { addFriend, friends } = useApp();
  const [query, setQuery] = useState("");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const existingIds = new Set(friends.map((f) => f.id));

  const searched =
    query.length > 0
      ? SUGGESTED_USERS.filter(
          (u) =>
            !existingIds.has(u.id) &&
            (u.name.toLowerCase().includes(query.toLowerCase()) ||
              u.username.toLowerCase().includes(query.toLowerCase()))
        )
      : [];

  function handleAdd(user: Friend) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addFriend({ ...user, isConnected: true });
    setAddedIds((prev) => new Set([...prev, user.id]));
  }

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
          placeholder="Search by username..."
          placeholderTextColor={colors.mutedForeground}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {query.length > 0 && searched.length === 0 && (
          <View style={styles.emptySearch}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No users found for "{query}"
            </Text>
          </View>
        )}

        {searched.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Results</Text>
            {searched.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                added={addedIds.has(user.id)}
                onAdd={handleAdd}
              />
            ))}
          </>
        )}

        {query.length === 0 && (
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

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              People You May Know
            </Text>
            {SUGGESTED_USERS.filter((u) => !existingIds.has(u.id)).map((user) => (
              <UserRow
                key={user.id}
                user={user}
                added={addedIds.has(user.id)}
                onAdd={handleAdd}
              />
            ))}
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
  user: Friend;
  added: boolean;
  onAdd: (u: Friend) => void;
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
    fontFamily: "Inter_700Bold",
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
    fontFamily: "Inter_400Regular",
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: 20,
    paddingBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  emptySearch: {
    paddingTop: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
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
    fontFamily: "Inter_600SemiBold",
  },
  discoverSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
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
    fontFamily: "Inter_700Bold",
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  userHandle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
});
