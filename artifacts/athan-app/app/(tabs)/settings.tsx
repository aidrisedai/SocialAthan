import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, notificationSettings, updateNotificationSettings, primaryMasjid, calcMethod } = useApp();

  const CALC_LABELS: Record<string, string> = {
    isna: "ISNA",
    mwl: "Muslim World League",
    umm: "Umm al-Qura",
    egypt: "Egyptian",
    karachi: "Karachi",
  };

  const RECITER_LABELS: Record<string, string> = {
    makkah: "Makkah",
    egypt: "Egypt",
    madina: "Madinah",
    alafasy: "Mishary Alafasy",
    husary: "Mahmoud Khalil al-Husary",
  };

  const topPaddingForWeb = Platform.OS === "web" ? 67 : insets.top;
  const bottomPaddingForWeb = Platform.OS === "web" ? 34 : 0;

  function toggleSetting(key: keyof typeof notificationSettings) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (typeof notificationSettings[key] === "boolean") {
      updateNotificationSettings({ [key]: !notificationSettings[key] });
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPaddingForWeb + 16,
          paddingBottom: 100 + bottomPaddingForWeb,
        }}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>

        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
              {(user?.name || "U").charAt(0)}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>
              {user?.name || "New User"}
            </Text>
            <Text style={[styles.profileUsername, { color: colors.mutedForeground }]}>
              @{user?.username || "user"}
            </Text>
          </View>
          <Pressable style={[styles.editBtn, { backgroundColor: colors.secondary }]}>
            <Ionicons name="pencil-outline" size={16} color={colors.primary} />
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Masjid</Text>
        <Pressable
          onPress={() => router.push("/masjid-select")}
          style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="location-outline" size={20} color={colors.primary} />
          <View style={styles.rowText}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Primary Masjid</Text>
            <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
              {primaryMasjid?.name ?? "None selected"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
        </Pressable>

        {primaryMasjid && (
          <Pressable
            onPress={() => router.push("/admin-portal")}
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="shield-outline" size={20} color={colors.primary} />
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Masjid Admin Portal</Text>
              <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>Manage times</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </Pressable>
        )}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Notifications</Text>
        <Pressable
          onPress={() => router.push("/notification-settings")}
          style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="notifications-outline" size={20} color={colors.primary} />
          <View style={styles.rowText}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Notification Settings</Text>
            <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
              {notificationSettings.masterEnabled ? "Adhan · Iqamah · Reminders" : "All off"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
        </Pressable>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Prayer Calculation</Text>
        <Pressable
          onPress={() => router.push("/calculation-method")}
          style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="calculator-outline" size={20} color={colors.primary} />
          <View style={styles.rowText}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Calculation Method</Text>
            <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
              {CALC_LABELS[calcMethod] ?? calcMethod.toUpperCase()}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
        </Pressable>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Adhan Audio</Text>
        <Pressable
          onPress={() => router.push("/adhan-audio")}
          style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="volume-high-outline" size={20} color={colors.primary} />
          <View style={styles.rowText}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Adhan Reciter</Text>
            <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
              {RECITER_LABELS[notificationSettings.adhanReciter] ?? notificationSettings.adhanReciter}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
        </Pressable>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Free forever · No ads · No data sold
          </Text>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Built as sadaqah jariyah
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  profileUsername: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  rowLabelSmall: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  rowValue: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  footer: {
    padding: 24,
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
