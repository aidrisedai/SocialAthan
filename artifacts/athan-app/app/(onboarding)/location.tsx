import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

export default function LocationScreen() {
  const colors = useColors();
  const [requesting, setRequesting] = useState(false);

  async function requestLocation() {
    setRequesting(true);
    if (Platform.OS !== "web") {
      try {
        await Location.requestForegroundPermissionsAsync();
      } catch (e) {
        if (__DEV__) console.warn("[onboarding/location] permission request failed:", e);
      }
    }
    setRequesting(false);
    router.push("/(onboarding)/masjid");
  }

  function skipLocation() {
    router.push("/(onboarding)/masjid");
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.inner}>
        <View style={styles.progress}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <View style={[styles.dot, { backgroundColor: colors.border }]} />
          <View style={[styles.dot, { backgroundColor: colors.border }]} />
          <View style={[styles.dot, { backgroundColor: colors.border }]} />
        </View>

        <View style={[styles.iconCircle, { backgroundColor: colors.highlight }]}>
          <Ionicons name="location" size={42} color={colors.primary} />
        </View>

        <View style={styles.textBlock}>
          <Text style={[styles.headline, { color: colors.foreground }]}>
            Find Nearby Masjids
          </Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            We'll suggest masjids near you so you can pick your primary one. Your location is never shared with other users.
          </Text>
        </View>

        <Pressable
          onPress={requestLocation}
          style={[styles.ctaBtn, { backgroundColor: colors.primary, opacity: requesting ? 0.7 : 1 }]}
          disabled={requesting}
        >
          <Ionicons name="location-outline" size={20} color={colors.primaryForeground} />
          <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>
            {requesting ? "Getting location..." : "Allow Location"}
          </Text>
        </Pressable>

        <Pressable onPress={skipLocation}>
          <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
            Search manually instead
          </Text>
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
    gap: 28,
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
