import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useApp, Prayer } from "@/context/AppContext";

const PRAYER_LABELS: Record<Prayer, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
  jummah: "Jumu'ah",
};

const PRAYERS_ORDERED: Prayer[] = ["fajr", "dhuhr", "asr", "maghrib", "isha", "jummah"];

export default function NotificationSettingsScreen() {
  const colors = useColors();
  const { notificationSettings, updateNotificationSettings } = useApp();
  const s = notificationSettings;
  const [permBlocked, setPermBlocked] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") return;
    let active = true;
    async function check() {
      const status = await Notifications.getPermissionsAsync();
      if (!active) return;
      setPermBlocked(!status.granted && !status.canAskAgain);
    }
    check();
    return () => {
      active = false;
    };
  }, []);

  function togglePerPrayer(prayer: Prayer, field: "adhan" | "iqamah", value: boolean) {
    updateNotificationSettings({
      perPrayer: {
        ...s.perPrayer,
        [prayer]: { ...s.perPrayer[prayer], [field]: value },
      },
    });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Notification Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {permBlocked && (
          <Pressable
            onPress={() => Linking.openSettings().catch(() => {})}
            style={[styles.permBanner, { backgroundColor: "#3A1A1A", borderColor: "#FF453A" }]}
          >
            <Ionicons name="alert-circle-outline" size={20} color="#FF453A" />
            <View style={styles.permBannerText}>
              <Text style={[styles.permBannerTitle, { color: "#FFB4AE" }]}>
                Notifications are blocked
              </Text>
              <Text style={[styles.permBannerSub, { color: "#FF8A85" }]}>
                Tap to open Settings and enable Athan notifications
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#FF453A" />
          </Pressable>
        )}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>All Notifications</Text>
                <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                  Enable or disable all prayer notifications
                </Text>
              </View>
            </View>
            <Switch
              value={s.masterEnabled}
              onValueChange={(v) => updateNotificationSettings({ masterEnabled: v })}
              trackColor={{ true: colors.primary }}
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Prayer Alerts
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="volume-high-outline" size={20} color={colors.primary} />
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Adhan Call</Text>
                <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                  Overrides Do Not Disturb · High priority
                </Text>
              </View>
            </View>
            <Switch
              value={s.masterEnabled && s.adhan}
              onValueChange={(v) => updateNotificationSettings({ adhan: v })}
              disabled={!s.masterEnabled}
              trackColor={{ true: colors.primary }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="alarm-outline" size={20} color={colors.primary} />
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Iqamah Reminder</Text>
                <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                  10 minutes before Iqamah · Respects DND
                </Text>
              </View>
            </View>
            <Switch
              value={s.masterEnabled && s.iqamah}
              onValueChange={(v) => updateNotificationSettings({ iqamah: v })}
              disabled={!s.masterEnabled}
              trackColor={{ true: colors.primary }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="hand-right-outline" size={20} color={colors.primary} />
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                  Pre-Prayer RSVP Prompt
                </Text>
                <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                  20 minutes before Adhan · Set your intention
                </Text>
              </View>
            </View>
            <Switch
              value={s.masterEnabled && s.rsvpPrompt}
              onValueChange={(v) => updateNotificationSettings({ rsvpPrompt: v })}
              disabled={!s.masterEnabled}
              trackColor={{ true: colors.primary }}
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Social Alerts
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="people-outline" size={20} color={colors.primary} />
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Friend RSVPs</Text>
                <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                  When friends mark themselves going · Respects DND
                </Text>
              </View>
            </View>
            <Switch
              value={s.masterEnabled && s.friendRSVPs}
              onValueChange={(v) => updateNotificationSettings({ friendRSVPs: v })}
              disabled={!s.masterEnabled}
              trackColor={{ true: colors.primary }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="star-outline" size={20} color={colors.primary} />
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Encouragements</Text>
                <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                  Streak milestones and motivational reminders
                </Text>
              </View>
            </View>
            <Switch
              value={s.masterEnabled && s.encouragements}
              onValueChange={(v) => updateNotificationSettings({ encouragements: v })}
              disabled={!s.masterEnabled}
              trackColor={{ true: colors.primary }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="flame-outline" size={20} color={colors.primary} />
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Streak Reminders</Text>
                <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                  Reminders to keep your jama'ah streak alive
                </Text>
              </View>
            </View>
            <Switch
              value={s.masterEnabled && s.streakReminders}
              onValueChange={(v) => updateNotificationSettings({ streakReminders: v })}
              disabled={!s.masterEnabled}
              trackColor={{ true: colors.primary }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="hand-left-outline" size={20} color={colors.primary} />
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Nudges from Friends</Text>
                <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                  When a friend sends you a prayer nudge
                </Text>
              </View>
            </View>
            <Switch
              value={s.masterEnabled && s.nudges}
              onValueChange={(v) => updateNotificationSettings({ nudges: v })}
              disabled={!s.masterEnabled}
              trackColor={{ true: colors.primary }}
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          Per-Prayer Notifications
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.row, { paddingBottom: 4 }]}>
            <View style={{ flex: 1 }} />
            <Text style={[styles.perPrayerColLabel, { color: colors.mutedForeground }]}>Adhan</Text>
            <Text style={[styles.perPrayerColLabel, { color: colors.mutedForeground }]}>Iqamah</Text>
          </View>
          {PRAYERS_ORDERED.map((prayer, i) => {
            const pp = s.perPrayer[prayer] ?? { adhan: true, iqamah: true };
            return (
              <React.Fragment key={prayer}>
                {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                <View style={styles.row}>
                  <Text style={[styles.rowLabel, { color: colors.foreground, flex: 1 }]}>
                    {PRAYER_LABELS[prayer]}
                  </Text>
                  <Switch
                    value={s.masterEnabled && pp.adhan}
                    onValueChange={(v) => togglePerPrayer(prayer, "adhan", v)}
                    disabled={!s.masterEnabled}
                    trackColor={{ true: colors.primary }}
                    style={styles.perPrayerSwitch}
                  />
                  <Switch
                    value={s.masterEnabled && pp.iqamah}
                    onValueChange={(v) => togglePerPrayer(prayer, "iqamah", v)}
                    disabled={!s.masterEnabled}
                    trackColor={{ true: colors.primary }}
                    style={styles.perPrayerSwitch}
                  />
                </View>
              </React.Fragment>
            );
          })}
        </View>

        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={16} color={colors.mutedForeground} />
          <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
            Adhan alerts are configured as critical notifications to override Do Not Disturb mode,
            ensuring you never miss the call to prayer. Social and reminder notifications respect your
            device's focus settings.
          </Text>
        </View>
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
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Lora_600SemiBold",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  permBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    margin: 16,
    marginTop: 0,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  permBannerText: {
    flex: 1,
  },
  permBannerTitle: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Lora_600SemiBold",
  },
  permBannerSub: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
    marginTop: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  rowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "500",
    fontFamily: "Lora_500Medium",
  },
  rowSub: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
    lineHeight: 16,
  },
  divider: {
    height: 1,
    marginLeft: 16,
  },
  noteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    margin: 20,
    padding: 14,
    borderRadius: 12,
  },
  noteText: {
    fontSize: 12,
    fontFamily: "Lora_400Regular",
    lineHeight: 18,
    flex: 1,
  },
  perPrayerColLabel: {
    fontSize: 11,
    fontFamily: "Lora_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    width: 58,
    textAlign: "center",
  },
  perPrayerSwitch: {
    width: 58,
  },
});
