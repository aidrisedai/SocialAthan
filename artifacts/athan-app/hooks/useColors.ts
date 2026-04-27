import { useColorScheme } from "react-native";

import colors from "@/constants/colors";

export function useColors() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark" && "dark" in colors;
  const palette: typeof colors.light = isDark
    ? (colors as { light: typeof colors.light; dark: typeof colors.light }).dark
    : colors.light;
  return { ...palette, radius: colors.radius };
}
