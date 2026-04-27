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
import { useApp, Prayer, PrayerTime, Masjid } from "@/context/AppContext";
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

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    prayerTimes,
    primaryMasjid,
    occasionalMasjids,
    setPrimaryMasjid,
    friendRSVPs,
    communityCounts,
    updateRSVP,
    pendingRSVP,
    clearPendingRSVP,
  } = useApp();
  const [rsvpTarget, setRsvpTarget] = useState<Prayer | null>(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  useEffect(() => {
    if (pendingRSVP) {
      setRsvpTarget(pendingRSVP);
      clearPendingRSVP();
    }
  }, [pendingRSVP, clearPendingRSVP]);

  const nextPrayer = useMemo(() => getNextPrayer(prayerTimes), [prayerTimes]);
  const masjidId = primaryMasjid?.id ?? "m1";
  const masjidFriendRSVPs = friendRSVPs[masjidId] ?? {};

  const switcherList = useMemo<Masjid[]>(() => {
    const list: Masjid[] = [];
    if (primaryMasjid) list.push(primaryMasjid);
    for (const m of occasionalMasjids) {
      if (!list.find((x) => x.id === m.id)) list.push(m);
    }
    return list;
  }, [primaryMasjid, occasionalMasjids]);

  const topPaddingForWeb = Platform.OS === "web" ? 67 : insets.top;
  const bottomPaddingForWeb = Platform.OS === "web" ? 34 : 0;

  const rsvpItem = rsvpTarget ? prayerTimes.find((p) => p.prayer === rsvpTarget) : null;

  function handlePickFromSwitcher(m: Masjid) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSwitcherOpen(false);
    if (m.id !== primaryMasjid?.id) setPrimaryMasjid(m);
  }

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
          <Pressable
            onPress={() => {
              if (switcherList.length > 1) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSwitcherOpen(true);
              } else {
                router.push("/masjid-select");
              }
            }}
            style={styles.headerLeft}
          >
            <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
              {formatDate()}
            </Text>
            <View style={styles.masjidNameRow}>
              <Text style={[styles.masjidName, { color: colors.foreground }]}>
                {primaryMasjid?.name ?? "Select a Masjid"}
              </Text>
              {switcherList.length > 1 && (
                <Ionicons name="chevron-down" size={16} color={colors.mutedForeground} />
              )}
            </View>
          </Pressable>
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
            communityCount={communityCounts[item.prayer] ?? 0}
            masjidWebsite={primaryMasjid?.website}
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

      <Modal
        visible={switcherOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSwitcherOpen(false)}
      >
        <Pressable style={styles.switcherBackdrop} onPress={() => setSwitcherOpen(false)}>
          <View style={[styles.switcherSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.switcherTitle, { color: colors.mutedForeground }]}>Switch masjid</Text>
            {switcherList.map((m) => {
              const active = m.id === primaryMasjid?.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => handlePickFromSwitcher(m)}
                  style={[styles.switcherRow, { borderBottomColor: colors.border }]}
                >
                  <View style={styles.switcherRowText}>
                    <Text style={[styles.switcherName, { color: colors.foreground }]}>{m.name}</Text>
                    <Text style={[styles.switcherAddress, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {m.address}
                    </Text>
                  </View>
                  {active && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => {
                setSwitcherOpen(false);
                router.push("/masjid-select");
              }}
              style={styles.switcherManage}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.mutedForeground} />
              <Text style={[styles.switcherManageText, { color: colors.mutedForeground }]}>
                Manage masjids
              </Text>
            </Pressable>
          </View>
        </Pressable>
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
  headerLeft: {
    flex: 1,
  },
  dateText: {
    fontSize: 13,
    fontFamily: "Lora_400Regular",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  masjidNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  masjidName: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Lora_700Bold",
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
    fontFamily: "Lora_500Medium",
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
  switcherBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-start",
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  switcherSheet: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 6,
    overflow: "hidden",
  },
  switcherTitle: {
    fontSize: 11,
    fontFamily: "Lora_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  switcherRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  switcherRowText: {
    flex: 1,
  },
  switcherName: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Lora_600SemiBold",
  },
  switcherAddress: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
    marginTop: 2,
  },
  switcherManage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  switcherManageText: {
    fontSize: 14,
    fontFamily: "Lora_500Medium",
  },
});
