import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useApp, Prayer, MasjidTimeOverride, buildPrayerTimes } from "@/context/AppContext";

const PRAYERS: Array<{ prayer: Prayer; label: string }> = [
  { prayer: "fajr", label: "Fajr" },
  { prayer: "dhuhr", label: "Dhuhr" },
  { prayer: "asr", label: "Asr" },
  { prayer: "maghrib", label: "Maghrib" },
  { prayer: "isha", label: "Isha" },
  { prayer: "jummah", label: "Jumu'ah (Friday)" },
];

type PrayerTimeMap = Record<Prayer, { adhan: string; iqamah: string }>;

export default function AdminPortalScreen() {
  const colors = useColors();
  const { masjidId: paramMasjidId } = useLocalSearchParams<{ masjidId?: string }>();
  const { primaryMasjid, nearbyMasjids, prayerTimes, updateMasjidTimes, claimMasjid, coords, calcMethod } = useApp();

  const targetMasjid = (paramMasjidId ? nearbyMasjids.find((m) => m.id === paramMasjidId) : null) ?? primaryMasjid;

  const [claimed, setClaimed] = useState(targetMasjid?.claimed ?? false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimEmail, setClaimEmail] = useState("");

  const targetPrayerTimes =
    targetMasjid && targetMasjid.id !== primaryMasjid?.id
      ? buildPrayerTimes(coords, calcMethod, targetMasjid, {})
      : prayerTimes;

  const initialTimes = (): PrayerTimeMap => {
    const fallback: PrayerTimeMap = {
      fajr: { adhan: "", iqamah: "" },
      dhuhr: { adhan: "", iqamah: "" },
      asr: { adhan: "", iqamah: "" },
      maghrib: { adhan: "", iqamah: "" },
      isha: { adhan: "", iqamah: "" },
      jummah: { adhan: "", iqamah: "" },
    };
    for (const pt of targetPrayerTimes) {
      fallback[pt.prayer] = { adhan: pt.adhan, iqamah: pt.iqamah };
    }
    const overrides = targetMasjid?.timeOverrides ?? {};
    for (const [k, v] of Object.entries(overrides)) {
      if (v) fallback[k as Prayer] = v;
    }
    return fallback;
  };

  const [editedTimes, setEditedTimes] = useState<PrayerTimeMap>(initialTimes());

  const TIME_PATTERN = /^(1[0-2]|0?[1-9]):[0-5][0-9]\s?(AM|PM)$/i;

  function validateTime(val: string) {
    return val.trim() === "" || TIME_PATTERN.test(val.trim());
  }

  function handleSave() {
    if (!targetMasjid) return;

    const invalid = PRAYERS.filter(({ prayer }) => {
      const t = editedTimes[prayer];
      return !validateTime(t.adhan) || !validateTime(t.iqamah);
    });

    if (invalid.length > 0) {
      const names = invalid.map((p) => p.label).join(", ");
      Alert.alert(
        "Invalid Format",
        `Please enter times as "5:22 AM" or "1:30 PM" for: ${names}`
      );
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const overrides: Partial<Record<Prayer, MasjidTimeOverride>> = {};
    for (const { prayer } of PRAYERS) {
      const t = editedTimes[prayer];
      const adhan = t.adhan.trim();
      const iqamah = t.iqamah.trim();
      if (adhan || iqamah) {
        overrides[prayer] = { adhan, iqamah };
      }
    }
    updateMasjidTimes(targetMasjid.id, overrides);
    Alert.alert("Saved", "Prayer times updated for your congregation.");
  }

  function handleClaim() {
    if (!claimEmail.trim() || !targetMasjid) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setClaimed(true);
    setShowClaimForm(false);
    claimMasjid(targetMasjid.id);
    Alert.alert(
      "Claim Submitted",
      "Your claim has been submitted for review. We'll notify you once verified."
    );
  }

  function updateTime(prayer: Prayer, field: "adhan" | "iqamah", value: string) {
    setEditedTimes((prev) => ({
      ...prev,
      [prayer]: { ...prev[prayer], [field]: value },
    }));
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Admin Portal</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.masjidBanner, { backgroundColor: colors.highlight }]}>
          <Ionicons name="location" size={20} color={colors.primary} />
          <Text style={[styles.masjidName, { color: colors.primary }]}>
            {targetMasjid?.name ?? "No Masjid Selected"}
          </Text>
          <View
            style={[
              styles.claimedBadge,
              { backgroundColor: claimed ? colors.primary : colors.secondary },
            ]}
          >
            <Text
              style={[
                styles.claimedText,
                {
                  color: claimed
                    ? colors.primaryForeground
                    : colors.mutedForeground,
                },
              ]}
            >
              {claimed ? "Verified Admin" : "Unclaimed"}
            </Text>
          </View>
        </View>

        {!claimed && !showClaimForm && (
          <Pressable
            onPress={() => setShowClaimForm(true)}
            style={[styles.claimBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons
              name="shield-outline"
              size={20}
              color={colors.primaryForeground}
            />
            <Text style={[styles.claimBtnText, { color: colors.primaryForeground }]}>
              Claim this Masjid
            </Text>
          </Pressable>
        )}

        {showClaimForm && (
          <View
            style={[
              styles.claimForm,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.claimFormTitle, { color: colors.foreground }]}>
              Claim Verification
            </Text>
            <Text style={[styles.claimFormBody, { color: colors.mutedForeground }]}>
              Enter your masjid's official email address for verification. Our team will review
              your request.
            </Text>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: colors.secondary, borderColor: colors.border },
              ]}
            >
              <Ionicons name="mail-outline" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.inputField, { color: colors.foreground }]}
                placeholder="masjid@example.org"
                placeholderTextColor={colors.mutedForeground}
                value={claimEmail}
                onChangeText={setClaimEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.claimFormBtns}>
              <Pressable
                onPress={() => setShowClaimForm(false)}
                style={[styles.cancelBtn, { backgroundColor: colors.secondary }]}
              >
                <Text style={[styles.cancelBtnText, { color: colors.foreground }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleClaim}
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.submitBtnText, { color: colors.primaryForeground }]}>
                  Submit
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {claimed && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              Prayer Times
            </Text>
            <Text style={[styles.sectionNote, { color: colors.mutedForeground }]}>
              Set official Adhan and Iqamah times. These override calculated times for all
              members of this masjid.
            </Text>

            {PRAYERS.map(({ prayer, label }) => (
              <View
                key={prayer}
                style={[
                  styles.prayerSection,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.prayerLabel, { color: colors.foreground }]}>{label}</Text>
                <View style={styles.timeInputs}>
                  <View style={styles.timeInput}>
                    <Text style={[styles.timeInputLabel, { color: colors.mutedForeground }]}>
                      Adhan
                    </Text>
                    <View
                      style={[
                        styles.inputBox,
                        { backgroundColor: colors.secondary, borderColor: colors.border },
                      ]}
                    >
                      <TextInput
                        style={[styles.inputText, { color: colors.foreground }]}
                        value={editedTimes[prayer].adhan}
                        onChangeText={(v) => updateTime(prayer, "adhan", v)}
                        placeholder="5:22 AM"
                        placeholderTextColor={colors.mutedForeground}
                      />
                    </View>
                  </View>
                  <View style={styles.timeInput}>
                    <Text style={[styles.timeInputLabel, { color: colors.mutedForeground }]}>
                      Iqamah
                    </Text>
                    <View
                      style={[
                        styles.inputBox,
                        { backgroundColor: colors.secondary, borderColor: colors.border },
                      ]}
                    >
                      <TextInput
                        style={[styles.inputText, { color: colors.foreground }]}
                        value={editedTimes[prayer].iqamah}
                        onChangeText={(v) => updateTime(prayer, "iqamah", v)}
                        placeholder="5:40 AM"
                        placeholderTextColor={colors.mutedForeground}
                      />
                    </View>
                  </View>
                </View>
              </View>
            ))}

            <Pressable
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={colors.primaryForeground}
              />
              <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
                Save Times
              </Text>
            </Pressable>
          </>
        )}
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
  masjidBanner: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    padding: 14,
    borderRadius: 14,
    gap: 10,
  },
  masjidName: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  claimedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  claimedText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  claimBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
    gap: 10,
  },
  claimBtnText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  claimForm: {
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  claimFormTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  claimFormBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  claimFormBtns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  submitBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: 20,
    paddingBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionNote: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 20,
    paddingBottom: 12,
    lineHeight: 18,
  },
  prayerSection: {
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  prayerLabel: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  timeInputs: {
    flexDirection: "row",
    gap: 10,
  },
  timeInput: {
    flex: 1,
    gap: 4,
  },
  timeInputLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  inputBox: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  inputText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    margin: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
