import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

export default function QRScanScreen() {
  const colors = useColors();
  const { user } = useApp();
  type ViewMode = "scan" | "show";
  const [view, setView] = useState<ViewMode>("show");
  const VIEW_TABS: ViewMode[] = ["show", "scan"];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>QR Code</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs}>
        {VIEW_TABS.map((t) => (
          <Pressable
            key={t}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setView(t); }}
            style={[
              styles.tab,
              { backgroundColor: view === t ? colors.primary : colors.secondary },
            ]}
          >
            <Text style={[styles.tabText, { color: view === t ? colors.primaryForeground : colors.mutedForeground }]}>
              {t === "show" ? "My Code" : "Scan Code"}
            </Text>
          </Pressable>
        ))}
      </View>

      {view === "show" && (
        <View style={styles.codeSection}>
          <View style={[styles.qrPlaceholder, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.qrGrid, { borderColor: colors.primary }]}>
              {Array.from({ length: 9 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.qrCell,
                    {
                      backgroundColor:
                        [0, 2, 6, 8, 1, 4, 5, 7].includes(i) ? colors.primary : "transparent",
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.qrUsername, { color: colors.foreground }]}>
              @{user?.username ?? "username"}
            </Text>
            <Text style={[styles.qrNote, { color: colors.mutedForeground }]}>
              Show this to friends to add you instantly
            </Text>
          </View>
        </View>
      )}

      {view === "scan" && (
        <View style={styles.scanSection}>
          <View style={[styles.scanFrame, { borderColor: colors.primary }]}>
            <View style={[styles.scanCorner, styles.topLeft, { borderColor: colors.primary }]} />
            <View style={[styles.scanCorner, styles.topRight, { borderColor: colors.primary }]} />
            <View style={[styles.scanCorner, styles.bottomLeft, { borderColor: colors.primary }]} />
            <View style={[styles.scanCorner, styles.bottomRight, { borderColor: colors.primary }]} />
            <Ionicons name="qr-code-outline" size={64} color={colors.mutedForeground} />
            <Text style={[styles.scanText, { color: colors.mutedForeground }]}>
              Point your camera at a QR code
            </Text>
          </View>
          <Text style={[styles.scanNote, { color: colors.mutedForeground }]}>
            Camera scanning available on device
          </Text>
        </View>
      )}
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
  tabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 24,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  codeSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  qrPlaceholder: {
    width: 280,
    borderRadius: 24,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 16,
  },
  qrGrid: {
    width: 160,
    height: 160,
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 2,
    borderRadius: 8,
    padding: 8,
    gap: 4,
  },
  qrCell: {
    width: 44,
    height: 44,
    borderRadius: 4,
  },
  qrUsername: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  qrNote: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  scanSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 16,
  },
  scanFrame: {
    width: 260,
    height: 260,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    gap: 12,
  },
  scanCorner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: "transparent",
    borderWidth: 3,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderRadius: 4,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRadius: 4,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderRadius: 4,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRadius: 4,
  },
  scanText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  scanNote: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
