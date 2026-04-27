import {
  Lora_400Regular,
  Lora_500Medium,
  Lora_600SemiBold,
  Lora_700Bold,
} from "@expo-google-fonts/lora";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider, useApp, Prayer, RSVPStatus } from "@/context/AppContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function NotificationHandler() {
  const { setPendingRSVP, updateRSVP } = useApp();

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        prayer?: string;
        type?: string;
      };
      const prayer = data?.prayer as Prayer | undefined;
      const actionId = response.actionIdentifier;

      if (!prayer) return;

      if (actionId === "going") {
        updateRSVP(prayer, "going" as RSVPStatus);
        router.navigate("/(tabs)");
      } else if (actionId === "maybe") {
        updateRSVP(prayer, "maybe" as RSVPStatus);
        router.navigate("/(tabs)");
      } else if (actionId === "dismiss") {
        if (data?.type === "rsvp_prompt") {
          updateRSVP(prayer, "cant" as RSVPStatus);
        }
      } else if (data?.type === "rsvp_prompt") {
        setPendingRSVP(prayer);
        router.navigate("/(tabs)");
      } else {
        router.navigate("/(tabs)");
      }
    });
    return () => sub.remove();
  }, [setPendingRSVP, updateRSVP]);

  return null;
}

function RootLayoutNav() {
  const { onboardingComplete } = useApp();

  useEffect(() => {
    if (!onboardingComplete) {
      router.replace("/(onboarding)/welcome");
    }
  }, [onboardingComplete]);

  return (
    <Stack screenOptions={{ headerBackTitle: "Back", headerShown: false }}>
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="masjid-select" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="masjid/[id]" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="masjid-chat/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="friend-discover" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="friend-search" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="contact-sync" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="friend/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="admin-portal" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="qr-scan" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="invite-link" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="calculation-method" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="adhan-audio" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="streak-detail" options={{ headerShown: false }} />
      <Stack.Screen name="notification-settings" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
    ...Feather.font,
    Lora_400Regular,
    Lora_500Medium,
    Lora_600SemiBold,
    Lora_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AppProvider>
                <NotificationHandler />
                <RootLayoutNav />
              </AppProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
