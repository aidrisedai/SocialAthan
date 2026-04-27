import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

const RECITERS = [
  { id: "makkah", name: "Makkah", desc: "Grand Mosque, Makkah (Default)" },
  { id: "madinah", name: "Madinah", desc: "Prophet's Mosque, Madinah" },
  { id: "mishary", name: "Mishary Rashid", desc: "Sheikh Mishary Alafasy" },
  { id: "abdulkarim", name: "Abdul Karim", desc: "Sheikh Abdul Karim Al-Makki" },
  { id: "silent", name: "Silent", desc: "No audio — notification only" },
];

export default function AdhanAudioScreen() {
  const colors = useColors();
  const [selected, setSelected] = useState("makkah");

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
          Adhan notifications override Do Not Disturb. Choose your preferred recitation.
        </Text>

        {RECITERS.map((r) => {
          const isSelected = selected === r.id;
          return (
            <Pressable
              key={r.id}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelected(r.id); }}
              style={[
                styles.reciterCard,
                {
                  backgroundColor: isSelected ? colors.highlight : colors.card,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={[styles.playBtn, { backgroundColor: isSelected ? colors.primary : colors.secondary }]}>
                <Ionicons
                  name={isSelected ? "volume-high" : "play"}
                  size={18}
                  color={isSelected ? colors.primaryForeground : colors.mutedForeground}
                />
              </View>
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
    fontFamily: "Inter_700Bold",
  },
  note: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
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
    fontFamily: "Inter_600SemiBold",
  },
  reciterDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
