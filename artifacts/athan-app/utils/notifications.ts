import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import type { PrayerTime, NotificationSettings } from "@/context/AppContext";

function notificationsSupported(): boolean {
  if (Platform.OS === "web") return false;
  const env = (Constants.executionEnvironment ?? "") as string;
  const isExpoGo = env === "storeClient";
  return !isExpoGo;
}

const ADHAN_CHANNEL_ID = "adhan-call";
const IQAMAH_CHANNEL_ID = "iqamah-reminder";
const SOCIAL_CHANNEL_ID = "social";

const ADHAN_CATEGORY = "ADHAN";
const IQAMAH_CATEGORY = "IQAMAH";
const RSVP_CATEGORY = "RSVP_PROMPT";

export async function setupNotificationChannel(): Promise<void> {
  if (!notificationsSupported()) return;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(ADHAN_CHANNEL_ID, {
      name: "Adhan Call",
      description: "Critical prayer-time alert — always plays regardless of DND",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 400, 200, 400],
      lightColor: "#1B6B5B",
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });

    await Notifications.setNotificationChannelAsync(IQAMAH_CHANNEL_ID, {
      name: "Iqamah Reminder",
      description: "10-minute heads-up before congregational prayer starts",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250],
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
    });

    await Notifications.setNotificationChannelAsync(SOCIAL_CHANNEL_ID, {
      name: "Social & Reminders",
      description: "Friend RSVPs, nudges, and encouragements",
      importance: Notifications.AndroidImportance.DEFAULT,
      enableVibrate: false,
      bypassDnd: false,
    });
  }

  await Notifications.setNotificationCategoryAsync(ADHAN_CATEGORY, [
    { identifier: "open", buttonTitle: "View prayers" },
  ]);

  await Notifications.setNotificationCategoryAsync(IQAMAH_CATEGORY, [
    { identifier: "going", buttonTitle: "Mark as Going" },
    { identifier: "dismiss", buttonTitle: "Dismiss", options: { isDestructive: true } },
  ]);

  await Notifications.setNotificationCategoryAsync(RSVP_CATEGORY, [
    { identifier: "going", buttonTitle: "Going ✓" },
    { identifier: "maybe", buttonTitle: "Maybe" },
    { identifier: "dismiss", buttonTitle: "Not today", options: { isDestructive: true } },
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

export async function scheduleNudgeNotification(
  friendName: string,
  settings: NotificationSettings
): Promise<void> {
  if (!notificationsSupported()) return;
  if (!settings.masterEnabled || !settings.nudges) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Nudge sent",
        body: `You nudged ${friendName} to join prayer today`,
        sound: false,
        data: { type: "nudge" },
        ...(Platform.OS === "ios"
          ? { interruptionLevel: "passive" as const }
          : { channelId: SOCIAL_CHANNEL_ID }),
      },
      trigger: null,
    });
  } catch (e) {
    if (__DEV__) console.warn("[notifications] nudge notification failed:", e);
  }
}

export async function scheduleStreakReminderNotification(
  streakDays: number,
  settings: NotificationSettings,
  ishaTime: string
): Promise<void> {
  if (!notificationsSupported()) return;
  if (!settings.masterEnabled || !settings.streakReminders) return;
  const ishaDate = parseTimeToDate(ishaTime);
  if (!ishaDate) return;
  const reminderDate = addMinutes(ishaDate, 15);
  if (reminderDate <= new Date()) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: streakDays > 0 ? `${streakDays}-prayer streak 🔥` : "Keep your streak going",
        body: streakDays > 0
          ? "You're on a roll — don't miss Isha to extend your streak"
          : "Head to the masjid for Isha to start a new streak",
        sound: false,
        data: { type: "streak_reminder" },
        ...(Platform.OS === "ios"
          ? { interruptionLevel: "passive" as const }
          : { channelId: SOCIAL_CHANNEL_ID }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });
  } catch (e) {
    if (__DEV__) console.warn("[notifications] streak reminder failed:", e);
  }
}

export async function scheduleAllPrayerNotifications(
  prayerTimes: PrayerTime[],
  settings: NotificationSettings
): Promise<void> {
  if (!notificationsSupported()) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!settings.masterEnabled) return;

  const now = new Date();
  const rsvpPromptEnabled = settings.rsvpPrompt;

  for (const prayer of prayerTimes) {
    const perPrayer = settings.perPrayer[prayer.prayer] ?? { adhan: true, iqamah: true };

    const adhanDate = parseTimeToDate(prayer.adhan);
    if (!adhanDate) continue;

    if (settings.adhan && perPrayer.adhan && adhanDate > now) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${prayer.label} · Adhan`,
            body: "It's time for prayer",
            sound: Platform.OS === "ios" && settings.adhanReciter !== "silent" ? `adhan_${settings.adhanReciter}.wav` : true,
            categoryIdentifier: ADHAN_CATEGORY,
            data: { prayer: prayer.prayer, type: "adhan", reciter: settings.adhanReciter },
            ...(Platform.OS === "ios"
              ? { interruptionLevel: "critical" as const }
              : { channelId: ADHAN_CHANNEL_ID, priority: "max" }),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: adhanDate,
          },
        });
      } catch (e) {
        if (__DEV__) console.warn("[notifications] adhan schedule failed:", e);
      }
    }

    if (settings.iqamah && perPrayer.iqamah) {
      const iqamahDate = parseTimeToDate(prayer.iqamah);
      if (iqamahDate) {
        const reminderDate = addMinutes(iqamahDate, -10);
        if (reminderDate > now) {
          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `${prayer.label} · Iqamah in 10 minutes`,
                body: `${prayer.iqamah} — Head to the masjid now`,
                sound: true,
                categoryIdentifier: IQAMAH_CATEGORY,
                data: { prayer: prayer.prayer, type: "iqamah" },
                ...(Platform.OS === "ios"
                  ? { interruptionLevel: "timeSensitive" as const }
                  : { channelId: IQAMAH_CHANNEL_ID }),
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: reminderDate,
              },
            });
          } catch (e) {
            if (__DEV__) console.warn("[notifications] iqamah schedule failed:", e);
          }
        }
      }
    }

    if (rsvpPromptEnabled && adhanDate > now) {
      const promptDate = addMinutes(adhanDate, -20);
      if (promptDate > now) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `${prayer.label} in 20 minutes`,
              body: "Are you going to the masjid today?",
              sound: false,
              categoryIdentifier: RSVP_CATEGORY,
              data: { prayer: prayer.prayer, type: "rsvp_prompt" },
              ...(Platform.OS === "ios"
                ? { interruptionLevel: "active" as const }
                : { channelId: SOCIAL_CHANNEL_ID }),
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: promptDate,
            },
          });
        } catch (e) {
          if (__DEV__) console.warn("[notifications] rsvp prompt schedule failed:", e);
        }
      }
    }
  }
}
