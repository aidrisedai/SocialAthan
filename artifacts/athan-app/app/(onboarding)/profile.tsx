import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

function generateUsername() {
  const adjectives = ["blessed", "thankful", "sincere", "humble", "faithful"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${adj}${num}`;
}

export default function ProfileScreen() {
  const colors = useColors();
  const { updateUser } = useApp();
  const [name, setName] = useState("");
  const defaultUsername = generateUsername();

  function handleContinue() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateUser({
      id: "user1",
      name: name.trim() || "New User",
      username: defaultUsername,
      primaryMasjidId: null,
      occasionalMasjidIds: [],
      isAdmin: false,
      adminMasjidIds: [],
    });
    router.push("/(onboarding)/calculation");
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.inner}>
        <View style={styles.progress}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: i <= 3 ? colors.primary : colors.border }]}
            />
          ))}
        </View>

        <View style={styles.textBlock}>
          <Text style={[styles.headline, { color: colors.foreground }]}>
            What should we call you?
          </Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            Optional — you can set a name or skip for now.
          </Text>
        </View>

        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="person-outline" size={20} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Your name (optional)"
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="done"
          />
        </View>

        <View style={[styles.usernameCard, { backgroundColor: colors.highlight }]}>
          <Text style={[styles.usernameLabel, { color: colors.mutedForeground }]}>
            Your auto-assigned username
          </Text>
          <Text style={[styles.username, { color: colors.primary }]}>@{defaultUsername}</Text>
          <Text style={[styles.usernameNote, { color: colors.mutedForeground }]}>
            You can change this later in settings
          </Text>
        </View>

        <Pressable
          onPress={handleContinue}
          style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.primaryForeground} />
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
    gap: 4,
  },
  usernameLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.8,
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
    borderRadius: 16,
    gap: 8,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
