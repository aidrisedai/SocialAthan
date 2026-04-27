import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { api, saveAuthCredentials } from "@/context/api";

function generateUsername() {
  const adjectives = ["blessed", "thankful", "sincere", "humble", "faithful", "devoted", "patient", "generous"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const num = Math.floor(10000 + Math.random() * 89999);
  return `${adj}${num}`;
}

export default function ProfileScreen() {
  const colors = useColors();
  const { updateUser, onRegistered } = useApp();
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const defaultUsername = useMemo(() => generateUsername(), []);

  async function handleContinue() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const displayName = name.trim() || "New User";
    const code = inviteCode.trim();

    if (!code) {
      Alert.alert("Invite Code Required", "Please enter your invite code to continue.");
      return;
    }

    setIsRegistering(true);
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const username = attempt === 0 ? defaultUsername : generateUsername();
      try {
        const res = await api.auth.register(displayName, username, code);
        await saveAuthCredentials(res.authToken, res.user.id);
        updateUser({
          id: res.user.id,
          name: res.user.name,
          username: res.user.username,
          primaryMasjidId: null,
          occasionalMasjidIds: [],
          isAdmin: false,
          adminMasjidIds: [],
        });
        onRegistered(res.authToken);
        setIsRegistering(false);
        router.push("/(onboarding)/calculation");
        return;
      } catch (e: unknown) {
        const err = e instanceof Error ? e : new Error("Registration failed");
        if (err.message === "Username already taken") {
          lastError = err;
          continue;
        }
        setIsRegistering(false);
        Alert.alert("Could Not Register", err.message || "Registration failed. Please try again.", [{ text: "OK" }]);
        return;
      }
    }
    setIsRegistering(false);
    Alert.alert("Could Not Register", lastError?.message ?? "Registration failed. Please try again.", [{ text: "OK" }]);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.inner}>
        <View style={styles.progress}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: i <= 3 ? colors.foreground : colors.border }]}
            />
          ))}
        </View>

        <View style={styles.textBlock}>
          <Text style={[styles.headline, { color: colors.foreground }]}>
            What should we call you?
          </Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            Enter your invite code and an optional display name to get started.
          </Text>
        </View>

        <View style={[styles.inputContainer, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Ionicons name="person-outline" size={20} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Your name (optional)"
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
            editable={!isRegistering}
          />
        </View>

        <View style={[styles.inputContainer, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Ionicons name="key-outline" size={20} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Invite code (required)"
            placeholderTextColor={colors.mutedForeground}
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize="none"
            returnKeyType="done"
            editable={!isRegistering}
            onSubmitEditing={handleContinue}
          />
        </View>

        <View style={[styles.usernameCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.usernameLabel, { color: colors.mutedForeground }]}>
            Your auto-assigned username
          </Text>
          <Text style={[styles.username, { color: colors.foreground }]}>@{defaultUsername}</Text>
          <Text style={[styles.usernameNote, { color: colors.mutedForeground }]}>
            You can change this later in settings
          </Text>
        </View>

        <Pressable
          onPress={handleContinue}
          disabled={isRegistering}
          style={[styles.ctaBtn, { backgroundColor: colors.foreground, opacity: isRegistering ? 0.7 : 1 }]}
        >
          {isRegistering ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <>
              <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.primaryForeground} />
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    padding: 28,
    justifyContent: "center",
    gap: 24,
  },
  progress: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  textBlock: {
    gap: 8,
  },
  headline: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  body: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  usernameCard: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  usernameLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  usernameNote: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 50,
    gap: 8,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
