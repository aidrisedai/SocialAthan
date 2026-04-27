import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState, useMemo, useEffect } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp, Prayer, PrayerTime } from "@/context/AppContext";
import { PrayerCard } from "@/components/PrayerCard";
import { RSVPSheet } from "@/components/RSVPSheet";

function getNextPrayer(prayers: PrayerTime[]): Prayer | null {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  for (const p of prayers) {
    if (p.completed) continue;
    const [time, period] = p.adhan.split(" ");
    const [h, m] = time.split(":").map(Number);
    const minutes = ((period === "PM" && h !== 12) ? h + 12 : (period === "AM" && h === 12) ? 0 : h) * 60 + m;
    if (minutes > nowMinutes) return p.prayer;
  }
  return null;
}

function formatDate() {
  const now = new Date();
  return now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

const COMMUNITY_COUNTS: Record<string, number> = {
  fajr: 23,
  dhuhr: 41,
  jummah: 187,
  asr: 28,
  maghrib: 67,
  isha: 44,
};

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prayerTimes, primaryMasjid, friendRSVPs, updateRSVP, pendingRSVP, clearPendingRSVP } = useApp();
  const [rsvpTarget, setRsvpTarget] = useState<Prayer | null>(null);

  useEffect(() => {
    if (pendingRSVP) {
      setRsvpTarget(pendingRSVP);
      clearPendingRSVP();
    }
  }, [pendingRSVP, clearPendingRSVP]);

  const nextPrayer = useMemo(() => getNextPrayer(prayerTimes), [prayerTimes]);
  const masjidId = primaryMasjid?.id ?? "m1";
  const masjidFriendRSVPs = friendRSVPs[masjidId] ?? {};

  const topPaddingForWeb = Platform.OS === "web" ? 67 : insets.top;
  const bottomPaddingForWeb = Platform.OS === "web" ? 34 : 0;

  const rsvpItem = rsvpTarget ? prayerTimes.find((p) => p.prayer === rsvpTarget) : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPaddingForWeb + 16,
          paddingBottom: 100 + bottomPaddingForWeb,
        }}
      >
        <View style={styles.headerSection}>
          <View>
            <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
              {formatDate()}
            </Text>
            <Text style={[styles.masjidName, { color: colors.foreground }]}>
              {primaryMasjid?.name ?? "Select a Masjid"}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/masjid-select")}
            style={[styles.masjidBtn, { backgroundColor: colors.secondary }]}
          >
            <Ionicons name="location-outline" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {!primaryMasjid && (
          <Pressable
            onPress={() => router.push("/masjid-select")}
            style={[styles.noMasjidBanner, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          >
            <Ionicons name="information-circle-outline" size={18} color={colors.mutedForeground} />
            <Text style={[styles.noMasjidText, { color: colors.foreground }]}>
              Tap to select your primary masjid
            </Text>
          </Pressable>
        )}

        {prayerTimes.map((item) => (
          <PrayerCard
            key={item.prayer}
            item={item}
            isNext={item.prayer === nextPrayer}
            friendsGoing={masjidFriendRSVPs[item.prayer] ?? []}
            communityCount={COMMUNITY_COUNTS[item.prayer] ?? 0}
            onRSVP={(prayer) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setRsvpTarget(prayer);
            }}
          />
        ))}
      </ScrollView>

      <Modal
        visible={!!rsvpTarget}
        transparent
        animationType="slide"
        onRequestClose={() => setRsvpTarget(null)}
      >
        <View style={styles.sheetOverlay}>
          <Pressable
            style={styles.sheetBackdrop}
            onPress={() => setRsvpTarget(null)}
          />
          {rsvpItem && (
            <View style={[styles.sheetContainer, { backgroundColor: colors.card }]}>
              <RSVPSheet
                prayer={rsvpItem.prayer}
                prayerLabel={rsvpItem.label}
                adhanTime={rsvpItem.adhan}
                iqamahTime={rsvpItem.iqamah}
                onClose={() => setRsvpTarget(null)}
              />
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  dateText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  masjidName: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  masjidBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  noMasjidBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  noMasjidText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: "50%",
    maxHeight: "75%",
  },
});
