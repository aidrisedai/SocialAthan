import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { PrayerTime, NotificationSettings } from "@/context/AppContext";

const NOTIFICATION_CHANNEL_ID = "athan-prayers";
const ADHAN_CATEGORY = "ADHAN";
const IQAMAH_CATEGORY = "IQAMAH";

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: "Prayer Times",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#1B6B5B",
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });
  }

  await Notifications.setNotificationCategoryAsync(ADHAN_CATEGORY, [
    { identifier: "view", buttonTitle: "View prayers" },
  ]);

  await Notifications.setNotificationCategoryAsync(IQAMAH_CATEGORY, [
    { identifier: "going", buttonTitle: "Mark as Going" },
  ]);
}

function parseTimeToDate(timeStr: string): Date | null {
  const today = new Date().toDateString();
  const parsed = new Date(`${today} ${timeStr}`);
  if (isNaN(parsed.getTime())) return null;
  return parsed;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export async function scheduleAllPrayerNotifications(
  prayerTimes: PrayerTime[],
  settings: NotificationSettings
): Promise<void> {
  if (Platform.OS === "web") return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!settings.masterEnabled) return;

  const now = new Date();

  for (const prayer of prayerTimes) {
    const perPrayerEnabled = settings.perPrayer[prayer.prayer] ?? true;
    if (!perPrayerEnabled) continue;

    const adhanDate = parseTimeToDate(prayer.adhan);
    if (!adhanDate || adhanDate <= now) continue;

    if (settings.adhan) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${prayer.label} · Adhan`,
            body: "It's time for prayer",
            sound: true,
            categoryIdentifier: ADHAN_CATEGORY,
            data: { prayer: prayer.prayer, type: "adhan" },
            ...(Platform.OS === "ios"
              ? {
                  interruptionLevel: "timeSensitive" as const,
                }
              : {
                  channelId: NOTIFICATION_CHANNEL_ID,
                  priority: "max",
                }),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: adhanDate,
          },
        });
      } catch {}
    }

    if (settings.iqamah) {
      const iqamahDate = parseTimeToDate(prayer.iqamah);
      if (!iqamahDate) continue;
      const reminderDate = addMinutes(iqamahDate, -10);
      if (reminderDate <= now) continue;

      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${prayer.label} · Iqamah in 10 minutes`,
            body: `${prayer.iqamah} — Head to the masjid now`,
            sound: true,
            categoryIdentifier: IQAMAH_CATEGORY,
            data: { prayer: prayer.prayer, type: "iqamah" },
            ...(Platform.OS === "ios"
              ? {
                  interruptionLevel: "timeSensitive" as const,
                }
              : {
                  channelId: NOTIFICATION_CHANNEL_ID,
                  priority: "max",
                }),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: reminderDate,
          },
        });
      } catch {}
    }
  }
}
