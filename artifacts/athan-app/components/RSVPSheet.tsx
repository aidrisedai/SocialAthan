import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ComponentProps } from "react";
import { useColors } from "@/hooks/useColors";
import { Prayer, RSVPStatus, useApp } from "@/context/AppContext";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface Props {
  prayer: Prayer;
  prayerLabel: string;
  adhanTime: string;
  iqamahTime?: string;
  onClose: () => void;
}

interface Option {
  status: RSVPStatus;
  label: string;
  sublabel: string;
  icon: IoniconName;
}

const OPTIONS: Option[] = [
  {
    status: "going",
    label: "Going",
    sublabel: "Your intention is visible to friends",
    icon: "checkmark-circle",
  },
  {
    status: "maybe",
    label: "Maybe",
    sublabel: "Only you see this",
    icon: "help-circle",
  },
  {
    status: "cant",
    label: "Can't make it",
    sublabel: "Only you see this",
    icon: "close-circle",
  },
];

export function RSVPSheet({ prayer, prayerLabel, adhanTime, iqamahTime, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { updateRSVP, prayerTimes } = useApp();

  const currentRSVP = prayerTimes.find((p) => p.prayer === prayer)?.rsvp;

  function handleSelect(status: RSVPStatus) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateRSVP(prayer, status);
    onClose();
  }

  const optionColors: Record<NonNullable<RSVPStatus>, string> = {
    going: colors.going,
    maybe: colors.maybe,
    cant: colors.cantMakeIt,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={[styles.handle, { backgroundColor: colors.border }]} />

      <View style={styles.header}>
        <Text style={[styles.prayerName, { color: colors.foreground }]}>{prayerLabel}</Text>
        <Text style={[styles.times, { color: colors.mutedForeground }]}>
          {iqamahTime ? `Adhan ${adhanTime} · Iqamah ${iqamahTime}` : `Adhan ${adhanTime}`}
        </Text>
      </View>

      <View style={styles.options}>
        {OPTIONS.map((opt) => {
          const isSelected = currentRSVP === opt.status;
          const optColor = optionColors[opt.status as NonNullable<RSVPStatus>];

          if (opt.status === "going") {
            return (
              <Pressable
                key={String(opt.status)}
                onPress={() => handleSelect(opt.status)}
                style={[
                  styles.option,
                  {
                    backgroundColor: isSelected ? colors.going : colors.secondary,
                    borderWidth: isSelected ? 0 : 1,
                    borderColor: isSelected ? "transparent" : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={opt.icon}
                  size={24}
                  color={isSelected ? colors.goingForeground : colors.going}
                />
                <View style={styles.optionText}>
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: isSelected ? colors.goingForeground : colors.foreground },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text
                    style={[
                      styles.optionSublabel,
                      { color: isSelected ? "rgba(0,0,0,0.5)" : colors.mutedForeground },
                    ]}
                  >
                    {opt.sublabel}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark" size={18} color={colors.goingForeground} />
                )}
              </Pressable>
            );
          }

          return (
            <Pressable
              key={String(opt.status)}
              onPress={() => handleSelect(opt.status)}
              style={[
                styles.option,
                {
                  backgroundColor: isSelected ? optColor : "transparent",
                  borderWidth: 1,
                  borderColor: isSelected ? optColor : colors.border,
                },
              ]}
            >
              <Ionicons
                name={opt.icon}
                size={24}
                color={isSelected ? "#FFF" : optColor}
              />
              <View style={styles.optionText}>
                <Text
                  style={[
                    styles.optionLabel,
                    { color: isSelected ? "#FFF" : colors.foreground },
                  ]}
                >
                  {opt.label}
                </Text>
                <Text
                  style={[
                    styles.optionSublabel,
                    { color: isSelected ? "rgba(255,255,255,0.65)" : colors.mutedForeground },
                  ]}
                >
                  {opt.sublabel}
                </Text>
              </View>
              {isSelected && <Ionicons name="checkmark" size={18} color="#FFF" />}
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={onClose}
        style={[styles.dismissBtn, { paddingBottom: insets.bottom + 8 }]}
      >
        <Text style={[styles.dismissText, { color: colors.mutedForeground }]}>Dismiss</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    gap: 4,
  },
  prayerName: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Lora_700Bold",
  },
  times: {
    fontSize: 14,
    fontFamily: "Lora_400Regular",
  },
  options: {
    paddingHorizontal: 20,
    gap: 10,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 50,
    gap: 14,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Lora_600SemiBold",
  },
  optionSublabel: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: "Lora_400Regular",
  },
  dismissBtn: {
    alignItems: "center",
    padding: 20,
    paddingBottom: 12,
  },
  dismissText: {
    fontSize: 15,
    fontFamily: "Lora_500Medium",
  },
});
