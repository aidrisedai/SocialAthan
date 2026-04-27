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
import { Masjid, useApp } from "@/context/AppContext";

export default function MasjidSelectionScreen() {
  const colors = useColors();
  const { nearbyMasjids, setPrimaryMasjid } = useApp();
  const [selected, setSelected] = useState<string | null>(null);

  function handleSelect(masjid: Masjid) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(masjid.id);
  }

  function handleConfirm() {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const masjid = nearbyMasjids.find((m) => m.id === selected)!;
    setPrimaryMasjid(masjid);
    router.push("/(onboarding)/profile");
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.progress}>
          <View style={[styles.dot, { backgroundColor: colors.foreground }]} />
          <View style={[styles.dot, { backgroundColor: colors.foreground }]} />
          <View style={[styles.dot, { backgroundColor: colors.foreground }]} />
          <View style={[styles.dot, { backgroundColor: colors.border }]} />
          <View style={[styles.dot, { backgroundColor: colors.border }]} />
        </View>
        <Text style={[styles.headline, { color: colors.foreground }]}>
          Choose Your Masjid
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Select your primary masjid. You can change this anytime.
        </Text>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {nearbyMasjids.map((masjid) => {
          const isSelected = selected === masjid.id;
          return (
            <Pressable
              key={masjid.id}
              onPress={() => handleSelect(masjid)}
              style={[
                styles.masjidCard,
                {
                  backgroundColor: isSelected ? colors.secondary : colors.card,
                  borderColor: isSelected ? colors.foreground : colors.border,
                },
              ]}
            >
              <View style={styles.masjidLeft}>
                <Text style={[styles.masjidName, { color: colors.foreground }]}>
                  {masjid.name}
                </Text>
                <Text style={[styles.masjidAddress, { color: colors.mutedForeground }]}>
                  {masjid.address}
                </Text>
                <View style={styles.metaRow}>
                  {masjid.distance !== undefined && (
                    <Text style={[styles.distance, { color: colors.mutedForeground }]}>
                      {masjid.distance} mi
                    </Text>
                  )}
                  <Text style={[styles.members, { color: colors.mutedForeground }]}>
                    {masjid.memberCount} members
                  </Text>
                </View>
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={24} color={colors.foreground} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleConfirm}
          style={[
            styles.ctaBtn,
            {
              backgroundColor: selected ? colors.foreground : colors.secondary,
              opacity: selected ? 1 : 0.5,
            },
          ]}
          disabled={!selected}
        >
          <Text
            style={[
              styles.ctaText,
              { color: selected ? colors.primaryForeground : colors.mutedForeground },
            ]}
          >
            Continue
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 24,
    paddingBottom: 12,
    gap: 10,
  },
  progress: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headline: {
    fontSize: 26,
    fontWeight: "700",
    fontFamily: "Lora_700Bold",
  },
  body: {
    fontSize: 14,
    fontFamily: "Lora_400Regular",
  },
  list: {
    flex: 1,
    paddingTop: 8,
  },
  masjidCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  masjidLeft: {
    flex: 1,
    gap: 3,
  },
  masjidName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Lora_600SemiBold",
  },
  masjidAddress: {
    fontSize: 13,
    fontFamily: "Lora_400Regular",
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  distance: {
    fontSize: 12,
    fontFamily: "Lora_500Medium",
  },
  members: {
    fontSize: 12,
    fontFamily: "Lora_500Medium",
  },
  footer: {
    padding: 20,
    paddingBottom: 12,
  },
  ctaBtn: {
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: "center",
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Lora_600SemiBold",
  },
});
