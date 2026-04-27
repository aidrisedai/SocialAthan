import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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

const RECITERS = [
  { id: "makkah", name: "Makkah", desc: "Grand Mosque, Makkah (Default)", asset: require("../assets/audio/adhan_makkah.wav") },
  { id: "madinah", name: "Madinah", desc: "Prophet's Mosque, Madinah", asset: require("../assets/audio/adhan_madinah.wav") },
  { id: "mishary", name: "Mishary Rashid", desc: "Sheikh Mishary Alafasy", asset: require("../assets/audio/adhan_mishary.wav") },
  { id: "abdulkarim", name: "Abdul Karim", desc: "Sheikh Abdul Karim Al-Makki", asset: require("../assets/audio/adhan_abdulkarim.wav") },
  { id: "silent", name: "Silent", desc: "No audio — notification only", asset: null },
];

export default function AdhanAudioScreen() {
  const colors = useColors();
  const { notificationSettings, updateNotificationSettings } = useApp();
  const selected = notificationSettings.adhanReciter ?? "makkah";
  const [playingId, setPlayingId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  async function handlePreview(reciter: typeof RECITERS[0]) {
    if (!reciter.asset) return;

    if (playingId === reciter.id) {
      await soundRef.current?.stopAsync().catch(() => {});
      await soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
      setPlayingId(null);
      return;
    }

    await soundRef.current?.stopAsync().catch(() => {});
    await soundRef.current?.unloadAsync().catch(() => {});
    soundRef.current = null;

    try {
      const { sound } = await Audio.Sound.createAsync(reciter.asset, { shouldPlay: true });
      soundRef.current = sound;
      setPlayingId(reciter.id);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
          sound.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
      });
    } catch (e) {
      if (__DEV__) console.warn("[adhan-audio] playback failed:", e);
      setPlayingId(null);
    }
  }

  function handleSelect(reciter: typeof RECITERS[0]) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateNotificationSettings({ adhanReciter: reciter.id });
    handlePreview(reciter);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Adhan Audio</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.note, { color: colors.mutedForeground }]}>
          Adhan notifications override Do Not Disturb. Tap a reciter to preview, then tap again to stop.
        </Text>

        {RECITERS.map((r) => {
          const isSelected = selected === r.id;
          const isPlaying = playingId === r.id;
          return (
            <Pressable
              key={r.id}
              onPress={() => handleSelect(r)}
              style={[
                styles.reciterCard,
                {
                  backgroundColor: isSelected ? colors.highlight : colors.card,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              <Pressable
                onPress={() => handlePreview(r)}
                style={[styles.playBtn, { backgroundColor: isPlaying ? colors.primary : (isSelected ? colors.primary : colors.secondary) }]}
                hitSlop={8}
              >
                <Ionicons
                  name={isPlaying ? "stop" : (r.asset ? "play" : "volume-mute")}
                  size={18}
                  color={isPlaying || isSelected ? colors.primaryForeground : colors.mutedForeground}
                />
              </Pressable>
              <View style={styles.reciterInfo}>
                <Text style={[styles.reciterName, { color: colors.foreground }]}>{r.name}</Text>
                <Text style={[styles.reciterDesc, { color: colors.mutedForeground }]}>{r.desc}</Text>
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              )}
            </Pressable>
          );
        })}
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
  note: {
    fontSize: 13,
    fontFamily: "Lora_400Regular",
    paddingHorizontal: 20,
    paddingVertical: 12,
    lineHeight: 20,
  },
  reciterCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  playBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  reciterInfo: {
    flex: 1,
    gap: 3,
  },
  reciterName: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Lora_600SemiBold",
  },
  reciterDesc: {
    fontSize: 13,
    fontFamily: "Lora_400Regular",
  },
});
