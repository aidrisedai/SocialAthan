import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { StreakBadge } from "@/components/StreakBadge";

export default function StreaksScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { streaks } = useApp();

  const topStreak = Math.max(...streaks.map((s) => s.count), 0);
  const totalDays = streaks.reduce((acc, s) => acc + s.count, 0);
  const topPaddingForWeb = Platform.OS === "web" ? 67 : insets.top;
  const bottomPaddingForWeb = Platform.OS === "web" ? 34 : 0;

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
          <Text style={[styles.title, { color: colors.foreground }]}>Streaks</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Personal — only you can see this
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
            <Ionicons name="flame" size={22} color={colors.primaryForeground} />
            <Text style={[styles.summaryCount, { color: colors.primaryForeground }]}>{topStreak}</Text>
            <Text style={[styles.summaryLabel, { color: "rgba(255,255,255,0.75)" }]}>Best streak</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
            <Text style={[styles.summaryCount, { color: colors.foreground }]}>{totalDays}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Total days</Text>
          </View>
        </View>

        <View style={[styles.affirmationBanner, { backgroundColor: colors.highlight }]}>
          <Text style={[styles.affirmationText, { color: colors.primary }]}>
            {topStreak >= 7
              ? `${topStreak} days of Fajr in jama'ah, Alhamdulillah`
              : topStreak >= 3
              ? `Staying consistent, keep going!`
              : "Every prayer in jama'ah counts."}
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          By Prayer
        </Text>

        {streaks.map((streak) => (
          <StreakBadge key={streak.prayer} streak={streak} />
        ))}

        <View style={[styles.privacyNote, { backgroundColor: colors.secondary }]}>
          <Ionicons name="lock-closed-outline" size={16} color={colors.mutedForeground} />
          <Text style={[styles.privacyText, { color: colors.mutedForeground }]}>
            Your streaks are completely private. Only you see them — no leaderboards, no comparisons.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    gap: 4,
  },
  summaryCount: {
    fontSize: 36,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  affirmationBanner: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 14,
  },
  affirmationText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: 20,
    paddingBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    margin: 16,
    marginTop: 20,
    padding: 14,
    borderRadius: 14,
    gap: 10,
  },
  privacyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 20,
  },
});
