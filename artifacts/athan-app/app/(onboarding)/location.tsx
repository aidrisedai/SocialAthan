import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

export default function LocationScreen() {
  const colors = useColors();
  const { requestLocation } = useApp();
  const [requesting, setRequesting] = useState(false);
  const [denied, setDenied] = useState(false);

  async function handleRequestLocation() {
    setRequesting(true);
    setDenied(false);
    const result = await requestLocation();
    setRequesting(false);
    if (result === "granted") {
      router.push("/(onboarding)/masjid");
    } else {
      setDenied(true);
    }
  }

  function openSettings() {
    if (Platform.OS !== "web") {
      Linking.openSettings();
    }
  }

  function skipLocation() {
    router.push("/(onboarding)/masjid");
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.inner}>
        <View style={styles.progress}>
          <View style={[styles.dot, { backgroundColor: colors.foreground }]} />
          <View style={[styles.dot, { backgroundColor: colors.foreground }]} />
          <View style={[styles.dot, { backgroundColor: colors.border }]} />
          <View style={[styles.dot, { backgroundColor: colors.border }]} />
          <View style={[styles.dot, { backgroundColor: colors.border }]} />
        </View>

        <View style={[styles.iconCircle, { backgroundColor: denied ? "#3A1A1A" : colors.secondary }]}>
          <Ionicons
            name={denied ? "location-outline" : "location"}
            size={42}
            color={denied ? "#FF453A" : colors.foreground}
          />
        </View>

        <View style={styles.textBlock}>
          <Text style={[styles.headline, { color: colors.foreground }]}>
            {denied ? "Location Access Needed" : "Find Nearby Masjids"}
          </Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            {denied
              ? Platform.OS === "web"
                ? "Please allow location access in your browser when prompted, then try again."
                : "Location was denied. Please open Settings and enable location access for this app."
              : "We'll suggest masjids near you so you can pick your primary one. Your location is never shared with other users."}
          </Text>
        </View>

        {denied ? (
          <View style={styles.deniedActions}>
            {Platform.OS !== "web" && (
              <Pressable
                onPress={openSettings}
                style={[styles.ctaBtn, { backgroundColor: colors.foreground }]}
              >
                <Ionicons name="settings-outline" size={20} color={colors.primaryForeground} />
                <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>
                  Open Settings
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={handleRequestLocation}
              style={[styles.ctaBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
            >
              <Ionicons name="refresh-outline" size={20} color={colors.foreground} />
              <Text style={[styles.ctaText, { color: colors.foreground }]}>
                Try Again
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={handleRequestLocation}
            style={[styles.ctaBtn, { backgroundColor: colors.foreground, opacity: requesting ? 0.7 : 1 }]}
            disabled={requesting}
          >
            <Ionicons name="location-outline" size={20} color={colors.primaryForeground} />
            <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>
              {requesting ? "Getting location..." : "Allow Location"}
            </Text>
          </Pressable>
        )}

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
    fontFamily: "Lora_700Bold",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    fontFamily: "Lora_400Regular",
    paddingHorizontal: 10,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 50,
    gap: 8,
    width: "100%",
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Lora_600SemiBold",
  },
  skipText: {
    fontSize: 14,
    fontFamily: "Lora_400Regular",
    textDecorationLine: "underline",
  },
  deniedActions: {
    width: "100%",
    gap: 12,
  },
});
