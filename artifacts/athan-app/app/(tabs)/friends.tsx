import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import type { Href } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ComponentProps } from "react";
import { useColors } from "@/hooks/useColors";
import { useApp, Friend } from "@/context/AppContext";
import { FriendCard } from "@/components/FriendCard";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const TABS = ["Going Now", "All Friends", "Discover"] as const;
type Tab = (typeof TABS)[number];

interface DiscoverItem {
  icon: IoniconName;
  label: string;
  sub: string;
  route: Href;
}

const DISCOVER_ITEMS: DiscoverItem[] = [
  { icon: "qr-code-outline", label: "Scan QR Code", sub: "Add someone in person at the masjid", route: "/qr-scan" },
  { icon: "link-outline", label: "Share Invite Link", sub: "Send to WhatsApp, SMS, or anywhere", route: "/invite-link" },
  { icon: "search-outline", label: "Search by Username", sub: "Find a friend by their @username", route: "/friend-search" },
];

export default function FriendsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { friends, friendRSVPs, primaryMasjid, prayerTimes, addFriend } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("Going Now");
  const [searchQuery, setSearchQuery] = useState("");

  const masjidId = primaryMasjid?.id ?? "m1";
  const rsvps = friendRSVPs[masjidId] ?? {};

  const nextPrayer = prayerTimes.find((p) => !p.completed);

  const goingFriends = nextPrayer ? (rsvps[nextPrayer.prayer] ?? []) : [];

  const filteredFriends = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topPaddingForWeb = Platform.OS === "web" ? 67 : insets.top;
  const bottomPaddingForWeb = Platform.OS === "web" ? 34 : 0;

  function handleViewProfile(friend: Friend) {
    router.push({ pathname: "/friend/[id]", params: { id: friend.id } });
  }

  function handleNudge(friend: Friend) {
    Alert.alert("Nudge sent!", `A gentle reminder was sent to ${friend.name}.`);
  }

  function handleMessage(friend: Friend) {
    router.push({ pathname: "/chat/[id]", params: { id: friend.id } });
  }

  function handleAddFriend() {
    router.push("/friend-discover");
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPaddingForWeb + 16 }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>Friends</Text>
          <Pressable
            onPress={handleAddFriend}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="person-add-outline" size={18} color={colors.primaryForeground} />
          </Pressable>
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
            placeholder="Search friends..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          {TABS.map((tab) => (
            <Pressable
              key={tab}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab);
              }}
              style={[
                styles.tabChip,
                { backgroundColor: activeTab === tab ? colors.primary : colors.secondary },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === tab ? colors.primaryForeground : colors.mutedForeground,
                  },
                ]}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + bottomPaddingForWeb }}
      >
        {activeTab === "Going Now" && (
          <>
            {nextPrayer && (
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                Friends going to {nextPrayer.label} at {nextPrayer.adhan}
              </Text>
            )}
            {goingFriends.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={40} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  No friends going yet
                </Text>
                <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
                  Invite friends to see who's heading to the masjid
                </Text>
                <Pressable
                  onPress={() => router.push("/friend-discover")}
                  style={[styles.inviteBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.inviteBtnText, { color: colors.primaryForeground }]}>
                    Invite Friends
                  </Text>
                </Pressable>
              </View>
            ) : (
              goingFriends.map((f) => (
                <FriendCard
                  key={f.id}
                  friend={f}
                  prayerLabel={nextPrayer?.label}
                  showDuas
                  onViewProfile={handleViewProfile}
                  onNudge={handleNudge}
                  onMessage={handleMessage}
                />
              ))
            )}
          </>
        )}

        {activeTab === "All Friends" && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              {filteredFriends.length} connected
            </Text>
            {filteredFriends.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={40} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No friends yet</Text>
                <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
                  Add friends to see them going to prayers
                </Text>
                <Pressable
                  onPress={() => router.push("/friend-discover")}
                  style={[styles.inviteBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.inviteBtnText, { color: colors.primaryForeground }]}>
                    Add Friends
                  </Text>
                </Pressable>
              </View>
            ) : (
              filteredFriends.map((f) => (
                <FriendCard
                  key={f.id}
                  friend={f}
                  onViewProfile={handleViewProfile}
                  onNudge={handleNudge}
                  onMessage={handleMessage}
                />
              ))
            )}
          </>
        )}

        {activeTab === "Discover" && (
          <View style={styles.discoverSection}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              Find friends
            </Text>
            {DISCOVER_ITEMS.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => router.push(item.route)}
                style={[
                  styles.discoverCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={[styles.discoverIconCircle, { backgroundColor: colors.highlight }]}>
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
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  tabScroll: { flexGrow: 0 },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginTop: 8,
  },
  emptyBody: {
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  inviteBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  inviteBtnText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  discoverSection: {
    padding: 16,
    gap: 10,
  },
  discoverCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  discoverIconCircle: {
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
});
