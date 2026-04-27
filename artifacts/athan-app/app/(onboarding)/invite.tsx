import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  SafeAreaView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { logOnboardingDuration } from "@/utils/onboarding-timer";

export default function InviteScreen() {
  const colors = useColors();
  const { setOnboardingComplete, user } = useApp();
  const inviteLink = `https://athan.app/invite/${user?.username ?? "user"}`;

  async function handleShare() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS !== "web") {
      try {
        await Share.share({
          message: `Join me on Athan — a community app that helps Muslims attend congregational prayer together. ${inviteLink}`,
          url: inviteLink,
          title: "Join me on Athan",
        });
      } catch (e) {
        if (__DEV__) console.warn("Share error", e);
      }
    }
  }

  function handleFinish() {
    logOnboardingDuration();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setOnboardingComplete(true);
    router.replace("/(tabs)");
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.inner}>
        <View style={styles.progress}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={[styles.dot, { backgroundColor: colors.primary }]} />
          ))}
        </View>

        <View style={[styles.iconCircle, { backgroundColor: colors.highlight }]}>
          <Ionicons name="heart" size={44} color={colors.primary} />
        </View>

        <View style={styles.textBlock}>
          <Text style={[styles.headline, { color: colors.foreground }]}>
            Invite Your Brothers & Sisters
          </Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            Athan is more meaningful with your community. Share the app with friends
            from the masjid — every person who prays in jama'ah benefits from your
            invitation. Sadaqah jariyah.
          </Text>
        </View>

        <View style={styles.benefitList}>
          {[
            { icon: "people-outline" as const, text: "See who's going to each prayer" },
            { icon: "flame-outline" as const, text: "Build streaks together" },
            { icon: "chatbubble-outline" as const, text: "Coordinate and encourage each other" },
          ].map((b) => (
            <View key={b.text} style={[styles.benefit, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name={b.icon} size={18} color={colors.primary} />
              <Text style={[styles.benefitText, { color: colors.foreground }]}>{b.text}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={handleShare}
          style={[styles.shareBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="share-outline" size={20} color={colors.primaryForeground} />
          <Text style={[styles.shareBtnText, { color: colors.primaryForeground }]}>
            Invite Friends
          </Text>
        </Pressable>

        <Pressable onPress={handleFinish}>
          <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
            I'll do this later
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
    gap: 22,
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
    fontSize: 26,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  benefitList: {
    width: "100%",
    gap: 8,
  },
  benefit: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  benefitText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 8,
    width: "100%",
  },
  shareBtnText: {
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
