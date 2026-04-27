import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="location" />
      <Stack.Screen name="masjid" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="calculation" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="invite" />
    </Stack>
  );
}
