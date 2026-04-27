import { Redirect } from "expo-router";
import { useApp } from "@/context/AppContext";

export default function IndexRedirect() {
  const { onboardingComplete } = useApp();
  if (!onboardingComplete) {
    return <Redirect href="/(onboarding)/welcome" />;
  }
  return <Redirect href="/(tabs)" />;
}
