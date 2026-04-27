import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView as KAV } from "react-native-keyboard-controller";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

export default function ChatScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { friends, messages, sendMessage, user } = useApp();
  const friend = friends.find((f) => f.id === id);
  const chatId = `dm_${id}`;
  const chatMessages = messages[chatId] ?? [];
  const [text, setText] = useState("");

  function handleSend() {
    if (!text.trim()) return;
    sendMessage(chatId, text.trim());
    setText("");
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <View style={[styles.avatarSmall, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {(friend?.name ?? "?").charAt(0)}
          </Text>
        </View>
        <Text style={[styles.friendName, { color: colors.foreground }]}>
          {friend?.name ?? "Chat"}
        </Text>
      </View>

      <KAV
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={[...chatMessages].reverse()}
          inverted
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isMe = item.senderId === (user?.id ?? "user1") || item.senderId === "me";
            return (
              <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
                <Text
                  style={[
                    styles.messageText,
                    { color: isMe ? colors.primaryForeground : colors.foreground },
                  ]}
                >
                  {item.text}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={[styles.emptyChatText, { color: colors.mutedForeground }]}>
                Start a conversation with {friend?.name}
              </Text>
            </View>
          }
        />

        <View style={[styles.inputRow, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground }]}
            placeholder="Message..."
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={setText}
            multiline
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <Pressable
            onPress={handleSend}
            style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.secondary }]}
          >
            <Ionicons
              name="send"
              size={18}
              color={text.trim() ? colors.primaryForeground : colors.mutedForeground}
            />
          </Pressable>
        </View>
      </KAV>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  avatarSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  friendName: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  messageBubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
    marginVertical: 2,
  },
  myBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#1B6B5B",
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#EDF3F1",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  emptyChat: {
    padding: 40,
    alignItems: "center",
  },
  emptyChatText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
