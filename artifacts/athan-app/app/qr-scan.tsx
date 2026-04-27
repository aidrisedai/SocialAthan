import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState, useCallback } from "react";
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

const expoCamera =
  Platform.OS !== "web"
    ? (() => {
        try {
          return require("expo-camera") as {
            CameraView: React.ComponentType<{
              style?: object;
              facing?: string;
              barcodeScannerSettings?: { barcodeTypes: string[] };
              onBarcodeScanned?: (e: { data: string }) => void;
            }>;
            useCameraPermissions: () => [
              { granted: boolean } | null,
              () => Promise<{ granted: boolean }>
            ];
          };
        } catch {
          return null;
        }
      })()
    : null;

function NativeCameraScanner({ onScanned }: { onScanned: (data: string) => void }) {
  const colors = useColors();

  if (!expoCamera) {
    return (
      <View style={styles.permissionBox}>
        <Ionicons name="alert-circle-outline" size={52} color={colors.mutedForeground} />
        <Text style={[styles.permissionText, { color: colors.foreground }]}>
          Camera Unavailable
        </Text>
        <Text style={[styles.permissionSub, { color: colors.mutedForeground }]}>
          Please use a development build for full camera access.
        </Text>
      </View>
    );
  }

  const { CameraView, useCameraPermissions } = expoCamera;
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission?.granted) {
    return (
      <View style={styles.permissionBox}>
        <Ionicons name="camera-outline" size={52} color={colors.mutedForeground} />
        <Text style={[styles.permissionText, { color: colors.foreground }]}>
          Camera Access Required
        </Text>
        <Text style={[styles.permissionSub, { color: colors.mutedForeground }]}>
          Allow camera access to scan friend QR codes.
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
    );
  }

  return (
    <View style={styles.cameraWrapper}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={({ data }) => onScanned(data)}
      />
      <View style={styles.overlay} pointerEvents="none">
        <View style={[styles.scanCorner, styles.topLeft, { borderColor: colors.primary }]} />
        <View style={[styles.scanCorner, styles.topRight, { borderColor: colors.primary }]} />
        <View style={[styles.scanCorner, styles.bottomLeft, { borderColor: colors.primary }]} />
        <View style={[styles.scanCorner, styles.bottomRight, { borderColor: colors.primary }]} />
      </View>
    </View>
  );
}

function WebUnsupported() {
  const colors = useColors();
  return (
    <View style={styles.permissionBox}>
      <Ionicons name="qr-code-outline" size={52} color={colors.mutedForeground} />
      <Text style={[styles.permissionText, { color: colors.foreground }]}>
        QR Scanning Unavailable
      </Text>
      <Text style={[styles.permissionSub, { color: colors.mutedForeground }]}>
        Camera QR scanning is available on iOS and Android devices only.
      </Text>
    </View>
  );
}

export default function QRScanScreen() {
  const colors = useColors();
  const { user, addFriend, friends } = useApp();
  const [view, setView] = useState<ViewMode>("show");
  const [scanned, setScanned] = useState(false);

  const handleBarcode = useCallback(
    (data: string) => {
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

      Alert.alert("Add Friend", `Add @${username} as a friend?`, [
        { text: "Cancel", style: "cancel", onPress: () => setScanned(false) },
        {
          text: "Add Friend",
          onPress: () => {
            addFriend(newFriend);
            router.back();
          },
        },
      ]);
    },
    [scanned, user, friends, addFriend]
  );

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
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setView(t);
              setScanned(false);
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
          <View
            style={[styles.qrPlaceholder, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
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
          {scanned ? (
            <View style={styles.permissionBox}>
              <Ionicons name="checkmark-circle" size={52} color={colors.primary} />
              <Text style={[styles.permissionText, { color: colors.foreground }]}>
                QR Scanned
              </Text>
              <Pressable
                style={[styles.allowBtn, { backgroundColor: colors.primary }]}
                onPress={() => setScanned(false)}
              >
                <Text style={[styles.allowBtnText, { color: colors.primaryForeground }]}>
                  Scan Another
                </Text>
              </Pressable>
            </View>
          ) : Platform.OS === "web" ? (
            <WebUnsupported />
          ) : (
            <NativeCameraScanner onScanned={handleBarcode} />
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
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject },
  scanCorner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderWidth: 0,
  },
  topLeft: {
    top: 12, left: 12,
    borderTopWidth: 4, borderLeftWidth: 4,
    borderColor: "transparent", borderRadius: 4,
  },
  topRight: {
    top: 12, right: 12,
    borderTopWidth: 4, borderRightWidth: 4,
    borderColor: "transparent", borderRadius: 4,
  },
  bottomLeft: {
    bottom: 12, left: 12,
    borderBottomWidth: 4, borderLeftWidth: 4,
    borderColor: "transparent", borderRadius: 4,
  },
  bottomRight: {
    bottom: 12, right: 12,
    borderBottomWidth: 4, borderRightWidth: 4,
    borderColor: "transparent", borderRadius: 4,
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
