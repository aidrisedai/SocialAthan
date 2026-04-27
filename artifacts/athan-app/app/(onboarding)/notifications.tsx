import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import React, { useState } from "react";
import { Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import type { ComponentProps } from "react";
import { useColors } from "@/hooks/useColors";
import { setupNotificationChannel } from "@/utils/notifications";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface Feature {
  icon: IoniconName;
  text: string;
}

const FEATURES: Feature[] = [
  { icon: "volume-high-outline", text: "Adhan audio at prayer time" },
  { icon: "alarm-outline", text: "10-minute reminder before Iqamah" },
  { icon: "people-outline", text: "Friends going to the same prayer" },
];

const PROGRESS_DOTS = [0, 1, 2, 3, 4, 5];

export default function NotificationsScreen() {
  const colors = useColors();
  const [requesting, setRequesting] = useState(false);

  async function requestNotifications() {
    setRequesting(true);
    if (Platform.OS !== "web") {
      try {
        await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowCriticalAlerts: true,
          },
        });
        await setupNotificationChannel();
      } catch {}
    }
    setRequesting(false);
    advance();
  }

  function advance() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(onboarding)/invite");
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.inner}>
        <View style={styles.progress}>
          {PROGRESS_DOTS.map((i) => (
            <View key={i} style={[styles.dot, { backgroundColor: colors.primary }]} />
          ))}
        </View>

        <View style={[styles.iconCircle, { backgroundColor: colors.highlight }]}>
          <Ionicons name="notifications" size={42} color={colors.primary} />
        </View>

        <View style={styles.textBlock}>
          <Text style={[styles.headline, { color: colors.foreground }]}>
            Never Miss a Prayer
          </Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            Get notified at Adhan time and before Iqamah. Adhan alerts override Do Not Disturb
            so you hear the call even when your phone is silent.
          </Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View
              key={f.icon}
              style={[
                styles.featureRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Ionicons name={f.icon} size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.foreground }]}>{f.text}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={requestNotifications}
          style={[styles.ctaBtn, { backgroundColor: colors.primary, opacity: requesting ? 0.7 : 1 }]}
          disabled={requesting}
        >
          <Ionicons name="notifications-outline" size={20} color={colors.primaryForeground} />
          <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>
            {requesting ? "Enabling..." : "Enable Notifications"}
          </Text>
        </Pressable>

        <Pressable onPress={advance}>
          <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Maybe later</Text>
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
    alignItems: "center",
    gap: 24,
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
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    alignItems: "center",
    gap: 10,
  },
  headline: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    fontFamily: "Inter_700Bold",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 10,
  },
  features: {
    width: "100%",
    gap: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    gap: 14,
    borderWidth: 1,
  },
  featureText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 8,
    width: "100%",
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  skipText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textDecorationLine: "underline",
  },
});
