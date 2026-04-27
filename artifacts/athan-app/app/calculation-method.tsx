import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
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
import type { CalcMethod } from "@/utils/prayerTimes";

const METHODS: Array<{ id: CalcMethod; name: string; full: string; region: string }> = [
  {
    id: "isna",
    name: "ISNA",
    full: "Islamic Society of North America",
    region: "North America",
  },
  {
    id: "mwl",
    name: "MWL",
    full: "Muslim World League",
    region: "Europe / Far East",
  },
  {
    id: "umm",
    name: "Umm al-Qura",
    full: "Umm al-Qura University, Makkah",
    region: "Arabian Peninsula",
  },
  {
    id: "egypt",
    name: "Egyptian",
    full: "Egyptian General Authority of Survey",
    region: "Africa, Syria, Lebanon",
  },
  {
    id: "karachi",
    name: "Karachi",
    full: "University of Islamic Sciences, Karachi",
    region: "Pakistan, Bangladesh",
  },
];

export default function CalculationMethodScreen() {
  const colors = useColors();
  const { calcMethod, setCalcMethod } = useApp();

  function handleSelect(method: CalcMethod) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCalcMethod(method);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Calculation Method</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.note, { color: colors.mutedForeground }]}>
          When you've selected a primary masjid with official times set, those are used directly.
          This method applies as a fallback or personal override.
        </Text>

        {METHODS.map((method) => {
          const isSelected = calcMethod === method.id;
          return (
            <Pressable
              key={method.id}
              onPress={() => handleSelect(method.id)}
              style={[
                styles.methodCard,
                {
                  backgroundColor: isSelected ? colors.highlight : colors.card,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={styles.methodLeft}>
                <Text style={[styles.methodName, { color: colors.foreground }]}>
                  {method.name}
                </Text>
                <Text style={[styles.methodFull, { color: colors.mutedForeground }]}>
                  {method.full}
                </Text>
                <Text style={[styles.methodRegion, { color: colors.mutedForeground }]}>
                  {method.region}
                </Text>
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
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  methodLeft: { flex: 1, gap: 3 },
  methodName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  methodFull: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  methodRegion: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
