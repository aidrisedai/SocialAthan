import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useApp, Friend } from "@/context/AppContext";

type ViewMode = "show" | "scan";

let CameraView: React.ComponentType<{
  style?: object;
  facing?: "front" | "back";
  barcodeScannerSettings?: { barcodeTypes: string[] };
  onBarcodeScanned?: (data: { data: string }) => void;
}> | null = null;

let useCameraPermissions: (() => [
  { granted: boolean } | null,
  () => Promise<{ granted: boolean }>
]) | null = null;

if (Platform.OS !== "web") {
  try {
    const cam = require("expo-camera");
    CameraView = cam.CameraView;
    useCameraPermissions = cam.useCameraPermissions;
  } catch {}
}

function useCamPermissions() {
  const [status, setStatus] = useState<{ granted: boolean } | null>(null);
  async function requestPermission() {
    const result = { granted: false };
    if (useCameraPermissions) return result;
    return result;
  }
  return [status, requestPermission] as const;
}

export default function QRScanScreen() {
  const colors = useColors();
  const { user, addFriend, friends } = useApp();
  const [view, setView] = useState<ViewMode>("show");
  const [scanned, setScanned] = useState(false);

  const hookResult = useCameraPermissions ? useCameraPermissions() : useCamPermissions();
  const [permission, requestPermission] = hookResult as [
    { granted: boolean } | null,
    () => Promise<{ granted: boolean }>
  ];

  const handleBarcode = useCallback(
    ({ data }: { data: string }) => {
      if (scanned) return;
      setScanned(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const match = data.match(/athan\.app\/invite\/([^/?#]+)/);
      const username = match?.[1] ?? data.trim();

      if (username === user?.username) {
        Alert.alert("That's you!", "You scanned your own QR code.", [
          { text: "OK", onPress: () => setScanned(false) },
        ]);
        return;
      }

      const alreadyFriend = friends.some(
        (f) => f.username.toLowerCase() === username.toLowerCase()
      );
      if (alreadyFriend) {
        Alert.alert("Already Friends", `You're already connected with @${username}.`, [
          { text: "OK", onPress: () => { setScanned(false); router.back(); } },
        ]);
        return;
      }

      const newFriend: Friend = {
        id: `qr_${Date.now()}`,
        name: username,
        username,
        isConnected: true,
      };

      Alert.alert(
        "Add Friend",
        `Add @${username} as a friend?`,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setScanned(false),
          },
          {
            text: "Add Friend",
            onPress: () => {
              addFriend(newFriend);
              router.back();
            },
          },
        ]
      );
    },
    [scanned, user, friends, addFriend]
  );

  async function handleSwitchToScan() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!permission?.granted) {
      await requestPermission();
    }
    setView("scan");
    setScanned(false);
  }

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
        {(["show", "scan"] as ViewMode[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => {
              if (t === "scan") {
                handleSwitchToScan();
              } else {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setView("show");
              }
            }}
            style={[
              styles.tab,
              { backgroundColor: view === t ? colors.primary : colors.secondary },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: view === t ? colors.primaryForeground : colors.mutedForeground },
              ]}
            >
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
                      backgroundColor: [0, 2, 6, 8, 1, 4, 5, 7].includes(i)
                        ? colors.primary
                        : "transparent",
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.qrUsername, { color: colors.foreground }]}>
              @{user?.username ?? "username"}
            </Text>
            <Text style={[styles.qrLink, { color: colors.mutedForeground }]}>
              athan.app/invite/{user?.username ?? "username"}
            </Text>
            <Text style={[styles.qrNote, { color: colors.mutedForeground }]}>
              Show this to friends to add you instantly
            </Text>
          </View>
        </View>
      )}

      {view === "scan" && (
        <View style={styles.scanSection}>
          {Platform.OS !== "web" && CameraView && permission?.granted ? (
            <View style={styles.cameraWrapper}>
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={scanned ? undefined : handleBarcode}
              />
              <View style={styles.overlay} pointerEvents="none">
                <View style={[styles.scanCorner, styles.topLeft, { borderColor: colors.primary }]} />
                <View style={[styles.scanCorner, styles.topRight, { borderColor: colors.primary }]} />
                <View style={[styles.scanCorner, styles.bottomLeft, { borderColor: colors.primary }]} />
                <View style={[styles.scanCorner, styles.bottomRight, { borderColor: colors.primary }]} />
              </View>
              {scanned && (
                <Pressable
                  style={[styles.rescanBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setScanned(false)}
                >
                  <Text style={[styles.rescanText, { color: colors.primaryForeground }]}>
                    Scan Again
                  </Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={styles.permissionBox}>
              <Ionicons name="camera-outline" size={52} color={colors.mutedForeground} />
              <Text style={[styles.permissionText, { color: colors.foreground }]}>
                Camera Access Required
              </Text>
              <Text style={[styles.permissionSub, { color: colors.mutedForeground }]}>
                Allow camera access to scan QR codes.
              </Text>
              <Pressable
                onPress={requestPermission}
                style={[styles.allowBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.allowBtnText, { color: colors.primaryForeground }]}>
                  Allow Camera
                </Text>
              </Pressable>
            </View>
          )}
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
    gap: 12,
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
  qrLink: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
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
    paddingHorizontal: 24,
  },
  cameraWrapper: {
    width: 280,
    height: 280,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  scanCorner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderWidth: 0,
  },
  topLeft: {
    top: 12,
    left: 12,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "transparent",
    borderRadius: 4,
  },
  topRight: {
    top: 12,
    right: 12,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: "transparent",
    borderRadius: 4,
  },
  bottomLeft: {
    bottom: 12,
    left: 12,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: "transparent",
    borderRadius: 4,
  },
  bottomRight: {
    bottom: 12,
    right: 12,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "transparent",
    borderRadius: 4,
  },
  rescanBtn: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  rescanText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  permissionBox: {
    alignItems: "center",
    gap: 16,
    padding: 32,
  },
  permissionText: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  permissionSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  allowBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  allowBtnText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
