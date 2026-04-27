import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

const WEEK_DAYS = ["S", "M", "T", "W", "T", "F", "S"];

function buildWeekAttendance(count: number): boolean[] {
  const result: boolean[] = new Array(7).fill(false);
  for (let i = 6; i >= Math.max(0, 7 - count); i--) {
    result[i] = true;
  }
  return result;
}

export default function StreakDetailScreen() {
  const colors = useColors();
  const { streaks } = useApp();

  const totalPrayers = streaks.reduce((sum, s) => sum + s.count, 0);
  const longestStreak = Math.max(...streaks.map((s) => s.count));
  const activePrayers = streaks.filter((s) => s.count > 0).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Streak Detail</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="flame" size={24} color={colors.streak} />
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>{longestStreak}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Best Streak</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="checkmark-circle" size={24} color={colors.going} />
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>{totalPrayers}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Total Prayers</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="trophy-outline" size={24} color={colors.primary} />
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>{activePrayers}/5</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Active</Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          By Prayer
        </Text>

        {streaks.map((streak) => {
          const weekDays = buildWeekAttendance(streak.count);
          const pct = Math.min(streak.count / 30, 1);
          return (
            <View
              key={streak.prayer}
              style={[styles.streakCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.streakTop}>
                <Text style={[styles.prayerLabel, { color: colors.foreground }]}>
                  {streak.label}
                </Text>
                <View style={styles.streakBadge}>
                  <Ionicons name="flame" size={14} color={colors.streak} />
                  <Text style={[styles.streakCount, { color: colors.streak }]}>
                    {streak.count}
                  </Text>
                </View>
              </View>

              <View style={[styles.progressBar, { backgroundColor: colors.secondary }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${Math.round(pct * 100)}%` as `${number}%`,
                    },
                  ]}
                />
              </View>

              <View style={styles.weekRow}>
                {WEEK_DAYS.map((day, i) => (
                  <View key={`${streak.prayer}-${i}`} style={styles.dayItem}>
                    <View
                      style={[
                        styles.dayDot,
                        {
                          backgroundColor: weekDays[i]
                            ? colors.primary
                            : colors.secondary,
                        },
                      ]}
                    />
                    <Text style={[styles.dayLabel, { color: colors.mutedForeground }]}>
                      {day}
                    </Text>
                  </View>
                ))}
              </View>

              {streak.lastDate && (
                <Text style={[styles.lastDate, { color: colors.mutedForeground }]}>
                  Last attended: {streak.lastDate}
                </Text>
              )}
            </View>
          );
        })}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Milestone
        </Text>
        <View style={[styles.milestoneCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[7, 14, 30, 60, 100].map((n, i) => {
            const reached = longestStreak >= n;
            return (
              <View key={n} style={styles.milestoneItem}>
                <View
                  style={[
                    styles.milestoneDot,
                    { backgroundColor: reached ? colors.going : colors.secondary },
                  ]}
                >
                  {reached && <Ionicons name="checkmark" size={12} color="#FFF" />}
                </View>
                <Text
                  style={[
                    styles.milestoneLabel,
                    { color: reached ? colors.foreground : colors.mutedForeground },
                  ]}
                >
                  {n} days
                </Text>
              </View>
            );
          })}
        </View>
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
  summaryRow: {
    flexDirection: "row",
    padding: 16,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Lora_700Bold",
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: "Lora_400Regular",
    textAlign: "center",
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Lora_600SemiBold",
    paddingHorizontal: 20,
    paddingBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  streakCard: {
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  streakTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  prayerLabel: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Lora_600SemiBold",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  streakCount: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Lora_700Bold",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayItem: {
    alignItems: "center",
    gap: 4,
  },
  dayDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  dayLabel: {
    fontSize: 10,
    fontFamily: "Lora_500Medium",
  },
  lastDate: {
    fontSize: 11,
    fontFamily: "Lora_400Regular",
  },
  milestoneCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 5,
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  milestoneItem: {
    alignItems: "center",
    gap: 6,
  },
  milestoneDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneLabel: {
    fontSize: 10,
    fontFamily: "Lora_500Medium",
    textAlign: "center",
  },
});
