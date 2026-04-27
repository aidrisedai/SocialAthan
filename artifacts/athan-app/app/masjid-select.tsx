import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useState } from "react";
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
import { useColors } from "@/hooks/useColors";
import { Masjid, useApp } from "@/context/AppContext";
import { searchNearbyMasjids } from "@/utils/searchMasjids";

export default function MasjidSelectScreen() {
  const colors = useColors();
  const { nearbyMasjids, primaryMasjid, setPrimaryMasjid, coords } = useApp();
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [localList, setLocalList] = useState<Masjid[] | null>(null);

  const displayList = localList ?? nearbyMasjids;
  const filtered = displayList.filter(
    (m) =>
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.address.toLowerCase().includes(query.toLowerCase())
  );

  function handleSelect(masjid: Masjid) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPrimaryMasjid(masjid);
    router.back();
  }

  function handleViewDetails(masjid: Masjid) {
    router.push(`/masjid/${masjid.id}`);
  }

  async function handleRefresh() {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setRefreshing(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const results = await searchNearbyMasjids(loc.coords.latitude, loc.coords.longitude);
      setLocalList(results);
    } catch (e) {
      if (__DEV__) console.warn("[masjid-select] refresh failed:", e);
    }
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Select Masjid</Text>
        <Pressable onPress={handleRefresh} disabled={refreshing} hitSlop={8}>
          {refreshing ? (
            <ActivityIndicator size="small" color={colors.foreground} />
          ) : (
            <Ionicons name="refresh-outline" size={22} color={colors.foreground} />
          )}
        </Pressable>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search masjids..."
          placeholderTextColor={colors.mutedForeground}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No masjids found nearby
            </Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
              Tap the refresh icon above to search for masjids near your current location.
            </Text>
            <Pressable
              onPress={handleRefresh}
              style={[styles.refreshBtn, { backgroundColor: colors.primary }]}
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Text style={[styles.refreshBtnText, { color: colors.primaryForeground }]}>
                  Find Nearby Masjids
                </Text>
              )}
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              {filtered.length} Nearby Masjid{filtered.length !== 1 ? "s" : ""}
            </Text>
            {filtered.map((masjid) => {
              const isSelected = primaryMasjid?.id === masjid.id;
              return (
                <Pressable
                  key={masjid.id}
                  onPress={() => handleSelect(masjid)}
                  style={[
                    styles.masjidCard,
                    {
                      backgroundColor: isSelected ? colors.highlight : colors.card,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <View style={styles.masjidLeft}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.masjidName, { color: colors.foreground }]}>{masjid.name}</Text>
                      {!masjid.claimed && (
                        <View style={[styles.unclaimedBadge, { backgroundColor: colors.secondary }]}>
                          <Text style={[styles.unclaimedText, { color: colors.mutedForeground }]}>Unclaimed</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.masjidAddress, { color: colors.mutedForeground }]}>
                      {masjid.address}
                    </Text>
                    <View style={styles.metaRow}>
                      {masjid.distance !== undefined && (
                        <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                          {masjid.distance} mi
                        </Text>
                      )}
                      {masjid.memberCount > 0 && (
                        <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                          {masjid.memberCount} members
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.rightActions}>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    )}
                    <Pressable onPress={() => handleViewDetails(masjid)} hitSlop={8}>
                      <Ionicons name="information-circle-outline" size={22} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </>
        )}
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
    fontFamily: "Lora_700Bold",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
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
  masjidCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  masjidLeft: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  masjidName: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Lora_600SemiBold",
  },
  unclaimedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  unclaimedText: {
    fontSize: 11,
    fontFamily: "Lora_500Medium",
  },
  masjidAddress: {
    fontSize: 13,
    fontFamily: "Lora_400Regular",
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Lora_500Medium",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Lora_600SemiBold",
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  refreshBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 180,
  },
  refreshBtnText: {
    fontSize: 15,
    fontFamily: "Lora_600SemiBold",
  },
});
