import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import type { ComponentProps } from "react";
import { useColors } from "@/hooks/useColors";
import { Friend, Prayer, PrayerTime, RSVPStatus } from "@/context/AppContext";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface Props {
  item: PrayerTime;
  isNext: boolean;
  friendsGoing: Friend[];
  communityCount: number;
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

export function PrayerCard({ item, isNext, friendsGoing, communityCount, onRSVP }: Props) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;

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

  return (
    <Animated.View style={[{ transform: [{ scale }] }]}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.card,
          {
            backgroundColor: isNext ? colors.primary : colors.card,
            borderColor: isNext ? colors.primary : colors.border,
            borderWidth: 1,
          },
        ]}
      >
        <View style={styles.topRow}>
          <View style={styles.leftSection}>
            <Text
              style={[
                styles.prayerLabel,
                {
                  color: isNext
                    ? colors.primaryForeground
                    : colors.mutedForeground,
                },
              ]}
            >
              {item.label}
            </Text>
            <Text
              style={[
                styles.adhanTime,
                {
                  color: isNext ? colors.primaryForeground : colors.foreground,
                },
              ]}
            >
              {item.adhan}
            </Text>
            <Text
              style={[
                styles.iqamahTime,
                {
                  color: isNext
                    ? "rgba(255,255,255,0.7)"
                    : colors.mutedForeground,
                },
              ]}
            >
              Iqamah {item.iqamah}
            </Text>
          </View>

          <View style={styles.rightSection}>
            {item.completed ? (
              <View
                style={[
                  styles.completedBadge,
                  {
                    backgroundColor: isNext
                      ? "rgba(255,255,255,0.2)"
                      : colors.highlight,
                  },
                ]}
              >
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={
                    isNext ? colors.primaryForeground : colors.primary
                  }
                />
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
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.rsvpText}>{RSVP_LABELS[item.rsvp]}</Text>
              </View>
            ) : (
              <View
                style={[
                  styles.rsvpCTA,
                  {
                    borderColor: isNext
                      ? "rgba(255,255,255,0.4)"
                      : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.rsvpCTAText,
                    {
                      color: isNext
                        ? "rgba(255,255,255,0.85)"
                        : colors.mutedForeground,
                    },
                  ]}
                >
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
              {
                borderTopColor: isNext
                  ? "rgba(255,255,255,0.15)"
                  : colors.border,
              },
            ]}
          >
            <View style={styles.avatarRow}>
              {friendsGoing.slice(0, 3).map((f, i) => (
                <View
                  key={f.id}
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: isNext
                        ? "rgba(255,255,255,0.3)"
                        : colors.secondary,
                      marginLeft: i > 0 ? -8 : 0,
                      zIndex: 3 - i,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarText,
                      {
                        color: isNext
                          ? colors.primaryForeground
                          : colors.primary,
                      },
                    ]}
                  >
                    {f.name.charAt(0)}
                  </Text>
                </View>
              ))}
            </View>
            <Text
              style={[
                styles.socialText,
                {
                  color: isNext
                    ? "rgba(255,255,255,0.8)"
                    : colors.mutedForeground,
                },
              ]}
            >
              {friendsGoing.length > 0
                ? `${friendsGoing[0].name.split(" ")[0]}${
                    friendsGoing.length > 1
                      ? ` +${friendsGoing.length - 1}`
                      : ""
                  }${communityCount > 0 ? ` · +${communityCount} others` : ""}`
                : `${communityCount} going`}
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
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 18,
  },
  leftSection: { gap: 2 },
  rightSection: { alignItems: "flex-end" },
  prayerLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontFamily: "Inter_600SemiBold",
  },
  adhanTime: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: 4,
    fontFamily: "Inter_700Bold",
  },
  iqamahTime: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  rsvpText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  rsvpCTA: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  rsvpCTAText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
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
    fontFamily: "Inter_700Bold",
  },
  socialText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
