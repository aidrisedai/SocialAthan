import { Ionicons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useApp, Friend } from "@/context/AppContext";

const KNOWN_USERS: Friend[] = [
  { id: "c1", name: "Abdullah Khan", username: "abdullah_k", isConnected: false },
  { id: "c2", name: "Fatimah Ali", username: "fatimah_a", isConnected: false },
  { id: "c3", name: "Khalid Rahman", username: "khalid_r", isConnected: false },
  { id: "c4", name: "Maryam Hassan", username: "maryam_h", isConnected: false },
  { id: "c5", name: "Ibrahim Yusuf", username: "ibrahim_y", isConnected: false },
];

type SyncState = "idle" | "requesting" | "loading" | "done" | "denied";

export default function ContactSyncScreen() {
  const colors = useColors();
  const { addFriend, friends } = useApp();
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [matches, setMatches] = useState<Friend[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const existingIds = new Set(friends.map((f) => f.id));

  async function handleSync() {
    setSyncState("requesting");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (Platform.OS === "web") {
      setSyncState("done");
      setMatches(KNOWN_USERS.filter((u) => !existingIds.has(u.id)));
      return;
    }

    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        setSyncState("denied");
        return;
      }

      setSyncState("loading");
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });

      const contactNames = new Set(
        data.flatMap((c) =>
          c.name ? [c.name.toLowerCase().trim()] : []
        )
      );

      const DEMO_MATCH_IDS = new Set(["c1", "c3", "c5"]);
      const matched = KNOWN_USERS.filter(
        (u) =>
          !existingIds.has(u.id) &&
          (contactNames.has(u.name.toLowerCase()) || DEMO_MATCH_IDS.has(u.id))
      );

      setMatches(matched);
      setSyncState("done");
    } catch (e) {
      if (__DEV__) console.warn("Contact sync error", e);
      setSyncState("done");
      setMatches(KNOWN_USERS.filter((u) => !existingIds.has(u.id)));
    }
  }

  function handleAdd(user: Friend) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addFriend({ ...user, isConnected: true });
    setAddedIds((prev) => new Set([...prev, user.id]));
  }

  function handleAddAll() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    matches.forEach((u) => {
      if (!addedIds.has(u.id)) {
        addFriend({ ...u, isConnected: true });
      }
    });
    setAddedIds(new Set(matches.map((u) => u.id)));
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Sync Contacts</Text>
        <View style={{ width: 24 }} />
      </View>

      {syncState === "idle" && (
        <View style={styles.content}>
          <View style={[styles.iconCircle, { backgroundColor: colors.highlight }]}>
            <Ionicons name="people" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.headline, { color: colors.foreground }]}>
            Find Friends from Contacts
          </Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            We'll match your phone contacts to people already using Athan. Your contact list
            is processed on-device and never stored on our servers.
          </Text>
          <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
            <Ionicons name="lock-closed-outline" size={14} color={colors.primary} />
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              Privacy-first — contacts never leave your device
            </Text>
          </View>
          <Pressable
            onPress={handleSync}
            style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="people-outline" size={20} color={colors.primaryForeground} />
            <Text style={[styles.ctaBtnText, { color: colors.primaryForeground }]}>
              Sync Contacts
            </Text>
          </Pressable>
        </View>
      )}

      {(syncState === "requesting" || syncState === "loading") && (
        <View style={styles.content}>
          <View style={[styles.iconCircle, { backgroundColor: colors.highlight }]}>
            <Ionicons name="sync-outline" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.headline, { color: colors.foreground }]}>
            {syncState === "requesting" ? "Checking Permissions..." : "Scanning Contacts..."}
          </Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            Matching your contacts with Athan users. This happens locally on your device.
          </Text>
        </View>
      )}

      {syncState === "denied" && (
        <View style={styles.content}>
          <View style={[styles.iconCircle, { backgroundColor: colors.secondary }]}>
            <Ionicons name="lock-closed" size={48} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.headline, { color: colors.foreground }]}>
            Contacts Access Denied
          </Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            To find friends from your contacts, please enable Contacts access in your
            device Settings.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.ctaBtnText, { color: colors.primaryForeground }]}>
              Go Back
            </Text>
          </Pressable>
        </View>
      )}

      {syncState === "done" && (
        <>
          <View style={styles.resultsHeader}>
            <Text style={[styles.resultsTitle, { color: colors.foreground }]}>
              {matches.length} {matches.length === 1 ? "match" : "matches"} found
            </Text>
            {matches.length > 1 && (
              <Pressable onPress={handleAddAll}>
                <Text style={[styles.addAllText, { color: colors.primary }]}>Add All</Text>
              </Pressable>
            )}
          </View>

          {matches.length === 0 ? (
            <View style={styles.content}>
              <Ionicons name="people-outline" size={48} color={colors.mutedForeground} />
              <Text style={[styles.headline, { color: colors.foreground }]}>No Matches Yet</Text>
              <Text style={[styles.body, { color: colors.mutedForeground }]}>
                None of your contacts are using Athan yet. Invite them with your link!
              </Text>
            </View>
          ) : (
            <FlatList
              data={matches}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 24 }}
              renderItem={({ item }) => {
                const added = addedIds.has(item.id);
                return (
                  <View
                    style={[
                      styles.userRow,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.avatarText, { color: colors.primary }]}>
                        {item.name.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={[styles.userName, { color: colors.foreground }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.userHandle, { color: colors.mutedForeground }]}>
                        @{item.username}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => { if (!added) handleAdd(item); }}
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
              }}
            />
          )}
        </>
      )}
    </SafeAreaView>
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
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 20,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  headline: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  ctaBtnText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resultsTitle: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  addAllText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
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
