import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import type { ComponentProps } from "react";
import { useColors } from "@/hooks/useColors";
import { startOnboardingTimer } from "@/utils/onboarding-timer";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface Feature {
  icon: IoniconName;
  text: string;
}

const FEATURES: Feature[] = [
  { icon: "time-outline", text: "Accurate Adhan & Iqamah times" },
  { icon: "people-outline", text: "See friends going to each prayer" },
  { icon: "flame-outline", text: "Track your jama'ah streak" },
];

export default function WelcomeScreen() {
  const colors = useColors();

  useEffect(() => { startOnboardingTimer(); }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.inner}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: colors.secondary }]}>
            <Ionicons name="moon" size={48} color={colors.foreground} />
          </View>
        </View>

        <View style={styles.textBlock}>
          <Text style={[styles.headline, { color: colors.foreground }]}>
            Pray Together.{"\n"}Show Up More.
          </Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            See which friends are heading to the masjid for each prayer — and let them see you too.
          </Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.icon} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: colors.secondary }]}>
                <Ionicons name={f.icon} size={22} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.featureText, { color: colors.foreground }]}>{f.text}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => router.push("/(onboarding)/location")}
          style={[styles.ctaBtn, { backgroundColor: colors.foreground }]}
        >
          <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.primaryForeground} />
        </Pressable>

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          Free forever · No ads · No data sold
        </Text>
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
    gap: 32,
  },
  iconContainer: {
    alignItems: "center",
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: { gap: 10 },
  headline: {
    fontSize: 36,
    fontWeight: "700",
    lineHeight: 42,
    fontFamily: "Inter_700Bold",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "Inter_400Regular",
  },
  features: { gap: 14 },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 50,
    gap: 8,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  disclaimer: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
