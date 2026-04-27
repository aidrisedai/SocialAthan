import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import { Platform, Pressable, SafeAreaView, Share, StyleSheet, Text, View } from "react-native";
import type { ComponentProps } from "react";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface ShareButton {
  icon: IoniconName;
  label: string;
  color: string;
}

export default function InviteLinkScreen() {
  const colors = useColors();
  const { user } = useApp();
  const [copied, setCopied] = useState(false);
  const inviteLink = `https://athan.app/invite/${user?.username ?? "user"}`;

  const SHARE_BUTTONS: ShareButton[] = [
    { icon: "chatbubbles-outline", label: "WhatsApp", color: "#25D366" },
    { icon: "mail-outline", label: "SMS", color: "#007AFF" },
    { icon: "share-outline", label: "More", color: colors.primary },
  ];

  async function handleCopy() {
    await Clipboard.setStringAsync(inviteLink);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleNativeShare() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Invite Friends</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: colors.highlight }]}>
          <Ionicons name="link" size={36} color={colors.primary} />
        </View>

        <View style={styles.textBlock}>
          <Text style={[styles.headline, { color: colors.foreground }]}>Share Your Link</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            Share this link with friends so they can join and connect with you on Athan.
          </Text>
        </View>

        <View
          style={[styles.linkCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.linkText, { color: colors.foreground }]} numberOfLines={1}>
            {inviteLink}
          </Text>
          <Pressable
            onPress={handleCopy}
            style={[
              styles.copyBtn,
              { backgroundColor: copied ? colors.going : colors.primary },
            ]}
          >
            <Ionicons
              name={copied ? "checkmark" : "copy-outline"}
              size={18}
              color={colors.primaryForeground}
            />
          </Pressable>
        </View>

        <View style={styles.shareButtons}>
          {SHARE_BUTTONS.map((btn) => (
            <Pressable
              key={btn.label}
              onPress={handleNativeShare}
              style={[
                styles.shareBtn,
                { backgroundColor: btn.color + "18", borderColor: btn.color + "44" },
              ]}
            >
              <Ionicons name={btn.icon} size={22} color={btn.color} />
              <Text style={[styles.shareBtnText, { color: btn.color }]}>{btn.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
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
  content: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    gap: 28,
    justifyContent: "center",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    alignItems: "center",
    gap: 8,
  },
  headline: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Lora_700Bold",
  },
  body: {
    fontSize: 15,
    fontFamily: "Lora_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    width: "100%",
  },
  linkText: {
    fontSize: 13,
    fontFamily: "Lora_400Regular",
    flex: 1,
  },
  copyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  shareButtons: {
    flexDirection: "row",
    gap: 12,
  },
  shareBtn: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  shareBtnText: {
    fontSize: 13,
    fontFamily: "Lora_600SemiBold",
  },
});
