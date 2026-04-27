import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ComponentProps } from "react";
import { useColors } from "@/hooks/useColors";
import { Friend } from "@/context/AppContext";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const DUAS: string[] = ["May Allah accept", "See you there", "Barak Allahu feek", "Alhamdulillah"];

interface Props {
  friend: Friend;
  prayerLabel?: string;
  showDuas?: boolean;
  onViewProfile?: (friend: Friend) => void;
  onNudge?: (friend: Friend) => void;
  onMessage?: (friend: Friend) => void;
  onDua?: (friend: Friend, dua: string) => void;
}

export function FriendCard({ friend, prayerLabel, showDuas, onViewProfile, onNudge, onMessage, onDua }: Props) {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable
        style={styles.topRow}
        onPress={onViewProfile ? () => onViewProfile(friend) : undefined}
      >
        <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {friend.name.charAt(0)}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.foreground }]}>{friend.name}</Text>
          <Text style={[styles.username, { color: colors.mutedForeground }]}>
            @{friend.username}
          </Text>
          {prayerLabel && (
            <View style={[styles.goingBadge, { backgroundColor: colors.highlight }]}>
              <Ionicons name="checkmark-circle" size={12} color={colors.going} />
              <Text style={[styles.goingText, { color: colors.going }]}>
                Going to {prayerLabel}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.actions}>
          {onNudge && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onNudge(friend);
              }}
              style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
            >
              <Ionicons name="hand-left-outline" size={16} color={colors.primary} />
            </Pressable>
          )}
          {onMessage && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onMessage(friend);
              }}
              style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
            >
              <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
            </Pressable>
          )}
        </View>
      </Pressable>

      {showDuas && (
        <View style={[styles.duasRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.duasLabel, { color: colors.mutedForeground }]}>Quick Reactions</Text>
          {DUAS.map((dua) => (
            <Pressable
              key={dua}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onDua?.(friend, dua);
              }}
              style={[styles.duaChip, { backgroundColor: colors.secondary }]}
            >
              <Text style={[styles.duaText, { color: colors.foreground }]}>{dua}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: "hidden",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  username: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  goingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  goingText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  duasRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    paddingTop: 10,
    gap: 8,
    borderTopWidth: 1,
  },
  duasLabel: {
    width: "100%",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  duaChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  duaText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
