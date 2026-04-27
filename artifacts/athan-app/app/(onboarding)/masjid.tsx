import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { Masjid, useApp } from "@/context/AppContext";
import { api } from "@/context/api";

const DEFAULT_LAT = 40.7128;
const DEFAULT_LNG = -74.006;

function isDefaultCoords(c: { lat: number; lng: number }) {
  return Math.abs(c.lat - DEFAULT_LAT) < 0.01 && Math.abs(c.lng - DEFAULT_LNG) < 0.01;
}

export default function MasjidSelectionScreen() {
  const colors = useColors();
  const { nearbyMasjids, setPrimaryMasjid, coords, requestLocation } = useApp();
  const [selected, setSelected] = useState<string | null>(null);
  const [localList, setLocalList] = useState<Masjid[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const displayList = localList ?? nearbyMasjids;

  const runSearch = React.useCallback(async () => {
    setSearchError(null);
    setSearching(true);
    try {
      let workingCoords = coords;
      if (isDefaultCoords(workingCoords)) {
        setStatus("Connecting to your location…");
        const result = await requestLocation();
        if (result === "denied") {
          setSearchError("Location permission needed to find nearby masjids.");
          return;
        }
      }

      setStatus("Looking for masjids near you…");
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 15000)
      );
      const res = await Promise.race([
        api.masjids.nearby(workingCoords.lat, workingCoords.lng),
        timeoutPromise,
      ]);
      const results = (res.masjids ?? []) as Masjid[];
      const degraded = (res as { degraded?: boolean }).degraded === true;
      if (results.length > 0) {
        setLocalList(results);
        setStatus(null);
      } else if (degraded) {
        setSearchError("Search service is slow right now. Try again, or pick a masjid later from settings.");
      } else {
        setSearchError("No masjids found within 10 km. You can pick one later in settings.");
      }
    } catch {
      setSearchError("Search took too long. Tap Try again or skip for now.");
    } finally {
      setSearching(false);
      setStatus(null);
    }
  }, [coords, requestLocation]);

  useEffect(() => {
    if (hasFetched.current || displayList.length > 0) return;
    hasFetched.current = true;
    runSearch();
  }, [displayList.length, runSearch]);

  function handleSkip() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(onboarding)/profile");
  }

  function handleSelect(masjid: Masjid) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(masjid.id);
  }

  function handleConfirm() {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const masjid = displayList.find((m) => m.id === selected)!;
    setPrimaryMasjid(masjid);
    router.push("/(onboarding)/profile");
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.progress}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: i <= 1 ? colors.foreground : colors.border }]}
            />
          ))}
        </View>
        <Text style={[styles.headline, { color: colors.foreground }]}>
          Choose Your Masjid
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Select your primary masjid. You can change this anytime.
        </Text>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {searching && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.mutedForeground} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              {status ?? "Searching nearby masjids…"}
            </Text>
          </View>
        )}
        {searching && displayList.length > 0 && (
          <Text style={[styles.partialHint, { color: colors.mutedForeground }]}>
            {`Found ${displayList.length}. Looking for more — tap any to continue.`}
          </Text>
        )}
        {!searching && displayList.length === 0 && (
          <View style={styles.emptyBlock}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {searchError ?? "No masjids found. Make sure location permission was granted."}
            </Text>
            <Pressable
              onPress={runSearch}
              style={[styles.retryBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.retryText, { color: colors.foreground }]}>Try again</Text>
            </Pressable>
          </View>
        )}
        {displayList.map((masjid) => {
          const isSelected = selected === masjid.id;
          return (
            <Pressable
              key={masjid.id}
              onPress={() => handleSelect(masjid)}
              style={[
                styles.masjidCard,
                {
                  backgroundColor: isSelected ? colors.secondary : colors.card,
                  borderColor: isSelected ? colors.foreground : colors.border,
                },
              ]}
            >
              <View style={styles.masjidLeft}>
                <Text style={[styles.masjidName, { color: colors.foreground }]}>
                  {masjid.name}
                </Text>
                <Text style={[styles.masjidAddress, { color: colors.mutedForeground }]}>
                  {masjid.address}
                </Text>
                <View style={styles.metaRow}>
                  {masjid.distance !== undefined && (
                    <Text style={[styles.distance, { color: colors.mutedForeground }]}>
                      {masjid.distance} mi
                    </Text>
                  )}
                  {masjid.memberCount > 0 && (
                    <Text style={[styles.members, { color: colors.mutedForeground }]}>
                      {masjid.memberCount} members
                    </Text>
                  )}
                </View>
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={24} color={colors.foreground} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleConfirm}
          style={[
            styles.ctaBtn,
            {
              backgroundColor: selected ? colors.foreground : colors.secondary,
              opacity: selected ? 1 : 0.5,
            },
          ]}
          disabled={!selected}
        >
          <Text
            style={[
              styles.ctaText,
              { color: selected ? colors.primaryForeground : colors.mutedForeground },
            ]}
          >
            Continue
          </Text>
        </Pressable>
        <Pressable onPress={handleSkip} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
            I'll choose later
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 24,
    paddingBottom: 12,
    gap: 10,
  },
  progress: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headline: {
    fontSize: 26,
    fontWeight: "700",
    fontFamily: "Lora_700Bold",
  },
  body: {
    fontSize: 14,
    fontFamily: "Lora_400Regular",
  },
  list: {
    flex: 1,
    paddingTop: 8,
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
  masjidName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Lora_600SemiBold",
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
  distance: {
    fontSize: 12,
    fontFamily: "Lora_500Medium",
  },
  members: {
    fontSize: 12,
    fontFamily: "Lora_500Medium",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 24,
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Lora_400Regular",
  },
  partialHint: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
    textAlign: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  emptyBlock: {
    alignItems: "center",
    padding: 32,
    gap: 14,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  retryText: {
    fontSize: 14,
    fontFamily: "Lora_500Medium",
  },
  footer: {
    padding: 20,
    paddingBottom: 12,
    gap: 8,
  },
  ctaBtn: {
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: "center",
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Lora_600SemiBold",
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    textDecorationLine: "underline",
  },
});
