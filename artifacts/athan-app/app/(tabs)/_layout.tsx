import { Tabs } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
interface BottomTabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, { options: { tabBarAccessibilityLabel?: string } }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
}

const TAB_LABELS: Record<string, string> = {
  index: "Home",
  friends: "Friends",
  streaks: "Streaks",
  settings: "Settings",
};

function DarkTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: isWeb ? 20 : insets.bottom,
          height: isWeb ? 84 : 56 + insets.bottom,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const label = TAB_LABELS[route.name] ?? route.name;

        function onPress() {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }

        function onLongPress() {
          navigation.emit({ type: "tabLongPress", target: route.key });
        }

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel ?? label}
          >
            <Text
              style={[
                styles.tabLabel,
                { color: isFocused ? colors.foreground : colors.mutedForeground },
                isFocused && styles.tabLabelActive,
              ]}
            >
              {label}
            </Text>
            {isFocused && (
              <View style={[styles.dot, { backgroundColor: colors.foreground }]} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <DarkTabBar {...(props as unknown as BottomTabBarProps)} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="friends" options={{ title: "Friends" }} />
      <Tabs.Screen name="streaks" options={{ title: "Streaks" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    alignItems: "flex-start",
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    gap: 5,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: "Lora_500Medium",
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    fontFamily: "Lora_600SemiBold",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
