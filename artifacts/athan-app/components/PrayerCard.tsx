import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { Animated, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { ComponentProps } from "react";
import { useColors } from "@/hooks/useColors";
import { Friend, Prayer, PrayerTime, RSVPStatus } from "@/context/AppContext";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface Props {
  item: PrayerTime;
  isNext: boolean;
  friendsGoing: Friend[];
  communityCount: number;
  masjidWebsite?: string;
  onRSVP: (prayer: Prayer) => void;
}

const RSVP_LABELS: Record<NonNullable<RSVPStatus>, string> = {
  going: "Going",
  maybe: "Maybe",
  cant: "Can't make it",
};

const RSVP_ICONS: Record<NonNullable<RSVPStatus>, IoniconName> = {
  going: "checkmark-circle",
  maybe: "help-circle",
  cant: "close-circle",
};

export function PrayerCard({ item, isNext, friendsGoing, communityCount, masjidWebsite, onRSVP }: Props) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  function handleOpenWebsite() {
    if (!masjidWebsite) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = /^https?:\/\//i.test(masjidWebsite) ? masjidWebsite : `https://${masjidWebsite}`;
    Linking.openURL(url).catch(() => {});
  }

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onRSVP(item.prayer);
  }

  const rsvpColor =
    item.rsvp === "going"
      ? colors.going
      : item.rsvp === "maybe"
      ? colors.maybe
      : item.rsvp === "cant"
      ? colors.cantMakeIt
      : null;

  const cardBg = isNext ? "#252527" : colors.card;
  const cardBorderColor = isNext ? "rgba(255,255,255,0.15)" : colors.border;

  return (
    <Animated.View style={[{ transform: [{ scale }] }]}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.card,
          {
            backgroundColor: cardBg,
            borderColor: cardBorderColor,
            borderWidth: 1,
          },
        ]}
      >
        {isNext && (
          <View style={styles.nextBadgeRow}>
            <Text style={styles.nextBadgeText}>NEXT</Text>
          </View>
        )}

        <View style={styles.topRow}>
          <View style={styles.leftSection}>
            <Text style={[styles.prayerLabel, { color: colors.mutedForeground }]}>
              {item.label}
            </Text>
            <Text style={[styles.adhanTime, { color: colors.foreground }]}>
              {item.adhan}
            </Text>
            {item.iqamah ? (
              <Text style={[styles.iqamahTime, { color: colors.mutedForeground }]}>
                Iqamah {item.iqamah}
              </Text>
            ) : masjidWebsite ? (
              <Pressable onPress={handleOpenWebsite} style={styles.websiteRow}>
                <Ionicons name="open-outline" size={12} color={colors.mutedForeground} />
                <Text style={[styles.websiteText, { color: colors.mutedForeground }]}>
                  Iqamah on masjid website
                </Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.rightSection}>
            {item.completed ? (
              <View style={[styles.completedBadge, { backgroundColor: colors.secondary }]}>
                <Ionicons name="checkmark" size={18} color={colors.accent} />
              </View>
            ) : item.rsvp ? (
              <View
                style={[
                  styles.rsvpBadge,
                  { backgroundColor: rsvpColor ?? colors.secondary },
                ]}
              >
                <Ionicons
                  name={RSVP_ICONS[item.rsvp]}
                  size={16}
                  color={item.rsvp === "going" ? colors.goingForeground : "#FFFFFF"}
                />
                <Text
                  style={[
                    styles.rsvpText,
                    { color: item.rsvp === "going" ? colors.goingForeground : "#FFFFFF" },
                  ]}
                >
                  {RSVP_LABELS[item.rsvp]}
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.rsvpCTA,
                  { borderColor: "rgba(255,255,255,0.2)" },
                ]}
              >
                <Text style={[styles.rsvpCTAText, { color: colors.mutedForeground }]}>
                  Set intention
                </Text>
              </View>
            )}
          </View>
        </View>

        {(friendsGoing.length > 0 || communityCount > 0) && (
          <View
            style={[
              styles.socialRow,
              { borderTopColor: "rgba(255,255,255,0.07)" },
            ]}
          >
            <View style={styles.avatarRow}>
              {friendsGoing.slice(0, 3).map((f, i) => (
                <View
                  key={f.id}
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: colors.secondary,
                      marginLeft: i > 0 ? -8 : 0,
                      zIndex: 3 - i,
                    },
                  ]}
                >
                  <Text style={[styles.avatarText, { color: colors.foreground }]}>
                    {f.name.charAt(0)}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={[styles.socialText, { color: colors.mutedForeground }]}>
              {(() => {
                const others = Math.max(0, communityCount - friendsGoing.length);
                if (friendsGoing.length === 0) {
                  return communityCount === 1 ? "1 going" : `${communityCount} going`;
                }
                const firstName = friendsGoing[0].name.split(" ")[0];
                const moreFriends = friendsGoing.length > 1 ? ` +${friendsGoing.length - 1}` : "";
                const moreOthers = others > 0 ? ` · +${others} other${others === 1 ? "" : "s"}` : "";
                return `${firstName}${moreFriends}${moreOthers}`;
              })()}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: "hidden",
  },
  nextBadgeRow: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 0,
  },
  nextBadgeText: {
    fontSize: 10,
    fontFamily: "Lora_600SemiBold",
    color: "#8E8E93",
    letterSpacing: 1.2,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 18,
    paddingTop: 12,
  },
  leftSection: { gap: 2 },
  rightSection: { alignItems: "flex-end", justifyContent: "center", marginTop: 4 },
  prayerLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: "Lora_600SemiBold",
  },
  adhanTime: {
    fontSize: 30,
    fontWeight: "700",
    marginTop: 4,
    fontFamily: "Lora_700Bold",
  },
  iqamahTime: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: "Lora_400Regular",
  },
  websiteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  websiteText: {
    fontSize: 12,
    fontFamily: "Lora_500Medium",
    textDecorationLine: "underline",
  },
  completedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  rsvpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  rsvpText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Lora_600SemiBold",
  },
  rsvpCTA: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  rsvpCTAText: {
    fontSize: 12,
    fontFamily: "Lora_500Medium",
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderTopWidth: 1,
    gap: 8,
    paddingTop: 10,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "Lora_700Bold",
  },
  socialText: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
  },
});
