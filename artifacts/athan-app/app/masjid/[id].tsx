import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useApp, Prayer, buildPrayerTimes } from "@/context/AppContext";

const PRAYER_LABELS: Record<Prayer, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
  jummah: "Jumu'ah",
};

export default function MasjidDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    nearbyMasjids, primaryMasjid, setPrimaryMasjid, coords, calcMethod,
    occasionalMasjids, addOccasionalMasjid, removeOccasionalMasjid,
  } = useApp();
  const masjid = nearbyMasjids.find((m) => m.id === id);
  const prayerTimes = masjid
    ? buildPrayerTimes(coords, calcMethod, masjid, {})
    : [];

  if (!masjid) return null;

  const isPrimary = primaryMasjid?.id === masjid.id;
  const isOccasional = occasionalMasjids.some((m) => m.id === masjid.id);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
          {masjid.name}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.masjidIcon, { backgroundColor: colors.highlight }]}>
            <Ionicons name="location" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.masjidName, { color: colors.foreground }]}>{masjid.name}</Text>
          <Text style={[styles.address, { color: colors.mutedForeground }]}>{masjid.address}</Text>
          <View style={styles.metaRow}>
            {masjid.memberCount > 0 && (
              <View style={[styles.metaBadge, { backgroundColor: colors.secondary }]}>
                <Ionicons name="people-outline" size={14} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                  {masjid.memberCount} members
                </Text>
              </View>
            )}
            <View style={[styles.metaBadge, { backgroundColor: masjid.claimed ? colors.highlight : colors.secondary }]}>
              <Ionicons
                name={masjid.claimed ? "shield-checkmark-outline" : "shield-outline"}
                size={14}
                color={masjid.claimed ? colors.primary : colors.mutedForeground}
              />
              <Text style={[styles.metaText, { color: masjid.claimed ? colors.primary : colors.mutedForeground }]}>
                {masjid.claimed ? "Verified" : "Unclaimed"}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Prayer Times</Text>
        {prayerTimes.map((pt) => (
          <View
            key={pt.prayer}
            style={[styles.prayerRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.prayerName, { color: colors.foreground }]}>{pt.label}</Text>
            <View style={styles.times}>
              <View style={styles.timeItem}>
                <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>Adhan</Text>
                <Text style={[styles.timeValue, { color: colors.foreground }]}>{pt.adhan}</Text>
              </View>
              {pt.iqamah ? (
                <>
                  <View style={[styles.timeDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.timeItem}>
                    <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>Iqamah</Text>
                    <Text style={[styles.timeValue, { color: colors.foreground }]}>{pt.iqamah}</Text>
                  </View>
                </>
              ) : null}
            </View>
          </View>
        ))}

        {masjid.website && (
          <Pressable
            onPress={() => {
              const url = /^https?:\/\//i.test(masjid.website!) ? masjid.website! : `https://${masjid.website}`;
              Linking.openURL(url).catch(() => {});
            }}
            style={[styles.websiteBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          >
            <Ionicons name="open-outline" size={18} color={colors.foreground} />
            <Text style={[styles.websiteBtnText, { color: colors.foreground }]}>
              View Iqamah times on masjid website
            </Text>
          </Pressable>
        )}

        {!masjid.claimed && (
          <Pressable
            onPress={() => router.push({ pathname: "/admin-portal", params: { masjidId: masjid.id } })}
            style={[styles.claimBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          >
            <Ionicons name="shield-outline" size={20} color={colors.primary} />
            <View style={styles.claimText}>
              <Text style={[styles.claimTitle, { color: colors.foreground }]}>Claim this masjid</Text>
              <Text style={[styles.claimSub, { color: colors.mutedForeground }]}>
                Update Adhan & Iqamah times for your community
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </Pressable>
        )}

        <Pressable
          onPress={() => router.push({ pathname: "/masjid-chat/[id]", params: { id: masjid.id } })}
          style={[styles.chatBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
        >
          <Ionicons name="chatbubbles-outline" size={20} color={colors.primary} />
          <View style={styles.chatBtnText}>
            <Text style={[styles.chatBtnTitle, { color: colors.foreground }]}>
              Community Chat
            </Text>
            <Text style={[styles.chatBtnSub, { color: colors.mutedForeground }]}>
              Chat with members of this masjid
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
        </Pressable>

        {!isPrimary && (
          <Pressable
            onPress={() => { setPrimaryMasjid(masjid); router.back(); }}
            style={[styles.setPrimaryBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.setPrimaryText, { color: colors.primaryForeground }]}>
              Set as Primary Masjid
            </Text>
          </Pressable>
        )}

        {!isPrimary && (
          <>
            <Pressable
              onPress={() => isOccasional ? removeOccasionalMasjid(masjid.id) : addOccasionalMasjid(masjid.id)}
              style={[
                styles.occasionalBtn,
                { backgroundColor: isOccasional ? colors.secondary : colors.highlight, borderColor: colors.border },
              ]}
            >
              <Ionicons
                name={isOccasional ? "bookmark" : "bookmark-outline"}
                size={18}
                color={colors.primary}
              />
              <Text style={[styles.occasionalText, { color: colors.primary }]}>
                {isOccasional ? "Remove from Occasional Masjids" : "Add as Occasional Masjid"}
              </Text>
            </Pressable>
            {!isOccasional && (
              <Text style={[styles.occasionalHint, { color: colors.mutedForeground }]}>
                Use for your work or travel masjid — switch from the home screen.
              </Text>
            )}
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
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Lora_600SemiBold",
    flex: 1,
    textAlign: "center",
  },
  infoCard: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  masjidIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  masjidName: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    fontFamily: "Lora_700Bold",
  },
  address: {
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Lora_400Regular",
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Lora_500Medium",
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Lora_600SemiBold",
    paddingHorizontal: 20,
    paddingBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  prayerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  prayerName: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Lora_600SemiBold",
    flex: 1,
  },
  times: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeItem: {
    alignItems: "center",
    gap: 2,
  },
  timeLabel: {
    fontSize: 10,
    fontFamily: "Lora_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  timeValue: {
    fontSize: 13,
    fontFamily: "Lora_600SemiBold",
  },
  timeDivider: {
    width: 1,
    height: 28,
  },
  claimBtn: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  websiteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  websiteBtnText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Lora_600SemiBold",
  },
  claimText: {
    flex: 1,
    gap: 2,
  },
  claimTitle: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Lora_600SemiBold",
  },
  claimSub: {
    fontSize: 13,
    fontFamily: "Lora_400Regular",
  },
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  chatBtnText: {
    flex: 1,
    gap: 2,
  },
  chatBtnTitle: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Lora_600SemiBold",
  },
  chatBtnSub: {
    fontSize: 13,
    fontFamily: "Lora_400Regular",
  },
  setPrimaryBtn: {
    margin: 16,
    marginTop: 4,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  setPrimaryText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Lora_600SemiBold",
  },
  occasionalBtn: {
    margin: 16,
    marginTop: 0,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  occasionalHint: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    textAlign: "center",
  },
  occasionalText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Lora_600SemiBold",
  },
});
