import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import type { CalcMethod } from "@/utils/prayerTimes";

interface MethodOption {
  id: CalcMethod;
  name: string;
  region: string;
}

const METHODS: MethodOption[] = [
  { id: "isna", name: "ISNA", region: "North America" },
  { id: "mwl", name: "Muslim World League", region: "Europe, Far East, parts of Americas" },
  { id: "umm", name: "Umm Al-Qura", region: "Arabian Peninsula" },
  { id: "egypt", name: "Egyptian General Authority", region: "Africa, Syria, Lebanon" },
  { id: "karachi", name: "University of Karachi", region: "Pakistan, Afghanistan, Bangladesh, India" },
];

export default function CalculationScreen() {
  const colors = useColors();
  const { calcMethod, setCalcMethod } = useApp();

  function handleContinue() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(onboarding)/notifications");
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.inner}>
        <View style={styles.progress}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: i <= 4 ? colors.primary : colors.border }]}
            />
          ))}
        </View>

        <View style={styles.textBlock}>
          <Text style={[styles.headline, { color: colors.foreground }]}>
            Calculation Method
          </Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            Choose the method used to calculate prayer times. You can change this anytime
            in Settings.
          </Text>
        </View>

        <View style={styles.methodList}>
          {METHODS.map((m) => {
            const selected = calcMethod === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCalcMethod(m.id);
                }}
                style={[
                  styles.methodCard,
                  {
                    backgroundColor: selected ? colors.highlight : colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
              >
                <View style={styles.methodText}>
                  <Text style={[styles.methodName, { color: colors.foreground }]}>{m.name}</Text>
                  <Text style={[styles.methodRegion, { color: colors.mutedForeground }]}>
                    {m.region}
                  </Text>
                </View>
                {selected && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={handleContinue}
          style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.primaryForeground} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    padding: 28,
    justifyContent: "center",
    gap: 20,
  },
  progress: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  textBlock: { gap: 8 },
  headline: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  body: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  methodList: { gap: 8 },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  methodText: { flex: 1, gap: 2 },
  methodName: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  methodRegion: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginTop: 4,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
