import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { StreakEntry } from "@/context/AppContext";

interface Props {
  streak: StreakEntry;
  compact?: boolean;
}

const AFFIRMATIONS = [
  "Alhamdulillah",
  "Keep it going",
  "MashaAllah",
  "Well done",
  "Blessed",
];

export function StreakBadge({ streak, compact }: Props) {
  const colors = useColors();
  const isActive = streak.count > 0;
  const affirmation = isActive ? AFFIRMATIONS[streak.count % AFFIRMATIONS.length] : null;

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: isActive ? colors.highlight : colors.secondary }]}>
        <Text style={[styles.compactCount, { color: isActive ? colors.going : colors.mutedForeground }]}>
          {streak.count}
        </Text>
        <Ionicons name="flame" size={14} color={isActive ? colors.streak : colors.mutedForeground} />
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={[styles.label, { color: colors.foreground }]}>{streak.label}</Text>
          {affirmation && (
            <Text style={[styles.affirmation, { color: colors.mutedForeground }]}>
              {affirmation}
            </Text>
          )}
        </View>
        <View style={styles.countSection}>
          <Ionicons
            name="flame"
            size={20}
            color={isActive ? colors.streak : colors.mutedForeground}
          />
          <Text style={[styles.count, { color: isActive ? colors.foreground : colors.mutedForeground }]}>
            {streak.count}
          </Text>
          <Text style={[styles.days, { color: colors.mutedForeground }]}>
            {streak.count === 1 ? "day" : "days"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  info: {
    gap: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  affirmation: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  countSection: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  count: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  days: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  compactCount: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
