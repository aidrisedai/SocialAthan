import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useApp, Prayer } from "@/context/AppContext";

const PRAYER_ORDER: Prayer[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export default function FriendProfileScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { friends, removeFriend, friendRSVPs, primaryMasjid, prayerTimes } = useApp();

  const friend = friends.find((f) => f.id === id);

  const masjidId = primaryMasjid?.id ?? "m1";
  const rsvps = friendRSVPs[masjidId] ?? {};

  const sharedPrayers = PRAYER_ORDER.filter((p) =>
    (rsvps[p] ?? []).some((f) => f.id === id)
  );

  const mockStreak = { count: 12, prayer: "Fajr" };

  const friendName = friend?.name ?? "";
  const friendId = id ?? "";
  const friendUsername = friend?.username ?? "";

  function handleMessage() {
    router.push({ pathname: "/chat/[id]", params: { id: friendId } });
  }

  function handleNudge() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Nudge sent", `A gentle reminder was sent to ${friendName}.`);
  }

  function handleUnfriend() {
    Alert.alert(
      "Remove Friend",
      `Are you sure you want to remove ${friendName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            removeFriend(friendId);
            router.back();
          },
        },
      ]
    );
  }

  if (!friend) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
        <Pressable onPress={handleUnfriend}>
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.highlight }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {friendName.charAt(0)}
            </Text>
          </View>
          <Text style={[styles.name, { color: colors.foreground }]}>{friendName}</Text>
          <Text style={[styles.username, { color: colors.mutedForeground }]}>
            @{friendUsername}
          </Text>
          <View style={styles.actionRow}>
            <Pressable
              onPress={handleMessage}
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="chatbubble-outline" size={18} color={colors.primaryForeground} />
              <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>
                Message
              </Text>
            </Pressable>
            <Pressable
              onPress={handleNudge}
              style={[styles.actionBtnSecondary, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            >
              <Ionicons name="hand-left-outline" size={18} color={colors.primary} />
              <Text style={[styles.actionBtnSecondaryText, { color: colors.primary }]}>Nudge</Text>
            </Pressable>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Attending Together Today
        </Text>
        {sharedPrayers.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="people-outline" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No shared prayers set for today
            </Text>
          </View>
        ) : (
          sharedPrayers.map((p) => {
            const pt = prayerTimes.find((t) => t.prayer === p);
            return (
              <View
                key={p}
                style={[styles.sharedRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.sharedDot, { backgroundColor: colors.going }]} />
                <Text style={[styles.sharedLabel, { color: colors.foreground }]}>
                  {pt?.label ?? p}
                </Text>
                <Text style={[styles.sharedTime, { color: colors.mutedForeground }]}>
                  {pt?.adhan} · Iqamah {pt?.iqamah}
                </Text>
              </View>
            );
          })
        )}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Activity
        </Text>
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Ionicons name="flame" size={22} color={colors.streak} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{mockStreak.count}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Day Streak</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={22} color={colors.going} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {sharedPrayers.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Today</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Ionicons name="trophy-outline" size={22} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>Fajr</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Best Prayer</Text>
          </View>
        </View>

        <Pressable
          onPress={handleUnfriend}
          style={[styles.unfriendBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
        >
          <Ionicons name="person-remove-outline" size={18} color={colors.cantMakeIt} />
          <Text style={[styles.unfriendText, { color: colors.cantMakeIt }]}>Remove Friend</Text>
        </Pressable>
      </ScrollView>
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
  profileCard: {
    margin: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  username: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    width: "100%",
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 14,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  actionBtnSecondaryText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  emptyCard: {
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  sharedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  sharedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sharedLabel: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  sharedTime: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  statsCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    alignSelf: "stretch",
  },
  unfriendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    margin: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  unfriendText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
