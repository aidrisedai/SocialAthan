import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
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
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

interface GroupMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

const SEED_MESSAGES: GroupMessage[] = [
  {
    id: "gm1",
    senderId: "f1",
    senderName: "Ibrahim Hassan",
    text: "Assalamu alaikum everyone! Who's coming for Fajr tomorrow?",
    timestamp: Date.now() - 3600_000,
  },
  {
    id: "gm2",
    senderId: "f2",
    senderName: "Yusuf Malik",
    text: "Wa alaikum assalam! I'll be there in sha Allah 🤲",
    timestamp: Date.now() - 3500_000,
  },
  {
    id: "gm3",
    senderId: "f3",
    senderName: "Omar Abdullah",
    text: "Same here. Trying to bring my brother too",
    timestamp: Date.now() - 3400_000,
  },
  {
    id: "gm4",
    senderId: "f1",
    senderName: "Ibrahim Hassan",
    text: "Alhamdulillah, see you all there. May Allah accept from us all!",
    timestamp: Date.now() - 3300_000,
  },
];

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function MasjidChatScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, nearbyMasjids } = useApp();
  const [messages, setMessages] = useState<GroupMessage[]>(SEED_MESSAGES);
  const [inputText, setInputText] = useState("");
  const listRef = useRef<FlatList<GroupMessage>>(null);

  const masjid = nearbyMasjids.find((m) => m.id === id) ?? nearbyMasjids[0];
  const userId = user?.id ?? "me";
  const userName = user?.name ?? "You";

  function sendMessage() {
    const text = inputText.trim();
    if (!text) return;
    const msg: GroupMessage = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      senderId: userId,
      senderName: userName,
      text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
    setInputText("");
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }

  function renderItem({ item }: { item: GroupMessage }) {
    const isOwn = item.senderId === userId;
    return (
      <View style={[styles.msgWrapper, isOwn && styles.msgWrapperOwn]}>
        {!isOwn && (
          <View style={[styles.msgAvatar, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.msgAvatarText, { color: colors.primary }]}>
              {item.senderName.charAt(0)}
            </Text>
          </View>
        )}
        <View style={styles.msgContent}>
          {!isOwn && (
            <Text style={[styles.msgSender, { color: colors.primary }]}>
              {item.senderName}
            </Text>
          )}
          <View
            style={[
              styles.msgBubble,
              isOwn
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
            ]}
          >
            <Text style={[styles.msgText, { color: isOwn ? colors.primaryForeground : colors.foreground }]}>
              {item.text}
            </Text>
          </View>
          <Text style={[styles.msgTime, { color: colors.mutedForeground, textAlign: isOwn ? "right" : "left" }]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            {masjid?.name ?? "Community Chat"}
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {masjid?.memberCount ?? 0} members
          </Text>
        </View>
        <Ionicons name="people-outline" size={22} color={colors.foreground} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        <View
          style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}
        >
          <TextInput
            style={[
              styles.textInput,
              { backgroundColor: colors.secondary, color: colors.foreground },
            ]}
            placeholder="Message the community..."
            placeholderTextColor={colors.mutedForeground}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <Pressable
            onPress={sendMessage}
            style={[styles.sendBtn, { backgroundColor: inputText.trim() ? colors.primary : colors.secondary }]}
          >
            <Ionicons
              name="send"
              size={18}
              color={inputText.trim() ? colors.primaryForeground : colors.mutedForeground}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  headerCenter: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  headerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  messageList: {
    padding: 16,
    gap: 12,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  msgWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginVertical: 4,
  },
  msgWrapperOwn: {
    flexDirection: "row-reverse",
  },
  msgAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  msgAvatarText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  msgContent: {
    flex: 1,
    gap: 3,
    maxWidth: "75%",
  },
  msgSender: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: 4,
  },
  msgBubble: {
    borderRadius: 18,
    padding: 12,
    paddingVertical: 9,
  },
  msgText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  msgTime: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 4,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    maxHeight: 120,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
});
