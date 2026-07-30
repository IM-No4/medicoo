import { useNavigation, useRoute } from "@react-navigation/native";
import { ChevronLeft, Send } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getOrderChatOptions, sendOrderChatMessage, getOrderChatHistory, restartOrderChat } from "../../../../services/api";

interface Message {
  id: string;
  sender: "bot" | "user" | "agent";
  text: string;
  timestamp: Date;
}

interface Option {
  id: string;
  text: string;
}

export default function OrderSupportScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const { orderId } = route.params || {
    orderId: "UNKNOWN",
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [inputText, setInputText] = useState("");
  const [activeOptions, setActiveOptions] = useState<Option[]>([]);
  const [chatStatus, setChatStatus] = useState<"open" | "closed">("open");
  const [loading, setLoading] = useState(true);

  const loadChatData = async () => {
    try {
      const historyData = await getOrderChatHistory(orderId);
      setChatStatus(historyData.status || "open");
      
      const mappedMessages = (historyData.messages || []).map((m: any, idx: number) => ({
        id: m._id || String(idx),
        sender: m.sender,
        text: m.text,
        timestamp: new Date(m.timestamp)
      }));
      setMessages(mappedMessages);

      if (historyData.status === "open") {
        const optionsData = await getOrderChatOptions(orderId);
        setActiveOptions(optionsData.options || []);
      } else {
        setActiveOptions([]);
      }
    } catch (err) {
      console.error("Error loading chat history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChatData();
  }, [orderId]);

  const handleOptionSelect = async (option: Option) => {
    if (chatStatus === "closed") return;

    // Add user bubble
    const userMsg: Message = {
      id: String(Date.now()),
      sender: "user",
      text: option.text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setTyping(true);

    try {
      const data = await sendOrderChatMessage(orderId, option.text);
      setTyping(false);

      const botMsg: Message = {
        id: String(Date.now() + 1),
        sender: data.sender || "bot",
        text: data.response || "No response received.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      
      if (data.status === "closed") {
        setChatStatus("closed");
        setActiveOptions([]);
        loadChatData();
      } else {
        const optionsData = await getOrderChatOptions(orderId);
        setActiveOptions(optionsData.options || []);
      }
    } catch (err) {
      setTyping(false);
      const errorMsg: Message = {
        id: String(Date.now() + 1),
        sender: "bot",
        text: "Sorry, I am facing an issue connecting to support right now. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleSendCustomMessage = async () => {
    if (chatStatus === "closed") return;
    const textToSend = inputText.trim();
    if (!textToSend) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setTyping(true);

    try {
      const data = await sendOrderChatMessage(orderId, textToSend);
      setTyping(false);

      const botMsg: Message = {
        id: String(Date.now() + 1),
        sender: data.sender || "bot",
        text: data.response || "No response received.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);

      if (data.status === "closed") {
        setChatStatus("closed");
        setActiveOptions([]);
        loadChatData();
      } else {
        const optionsData = await getOrderChatOptions(orderId);
        setActiveOptions(optionsData.options || []);
      }
    } catch (err) {
      setTyping(false);
      const errorMsg: Message = {
        id: String(Date.now() + 1),
        sender: "bot",
        text: "Sorry, I am facing an issue connecting to support right now. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleRestartChat = async () => {
    setLoading(true);
    try {
      await restartOrderChat(orderId);
      await loadChatData();
    } catch (err) {
      console.error("Error restarting support chat:", err);
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isBot = item.sender === "bot";
    const isAgent = item.sender === "agent";

    // Inline notification check for Agent Joined
    const isJoinNotification = isBot && item.text.includes("has joined the chat");

    if (isJoinNotification) {
      let displayName = "Agent";
      const match = item.text.match(/Agent\s+([^\n\r]+?)\s+has/);
      if (match && match[1]) {
        displayName = match[1];
      }
      const timeStr = item.timestamp.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>
            {displayName} Joined at {timeStr}
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.messageRow, (isBot || isAgent) ? styles.botRow : styles.userRow]}>
        <View
          style={[
            styles.bubble,
            (isBot || isAgent) ? styles.botBubble : styles.userBubble,
            isAgent && styles.agentBubble
          ]}
        >
          <Text
            style={[
              styles.messageText,
              (isBot || isAgent) ? styles.botText : styles.userText,
            ]}
          >
            {item.text}
          </Text>
        </View>
        <Text style={styles.timeText}>
          {item.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2FA561" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
      keyboardVerticalOffset={Platform.select({
        ios: insets.top + 60,
        android: 0,
      })}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Order Help</Text>
          <Text style={styles.headerSubtitle}>
            Order #{orderId.replace("ORD-", "")}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Chat list */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Typing Loader */}
      {typing && (
        <View style={styles.typingContainer}>
          <ActivityIndicator size="small" color="#2FA561" />
          <Text style={styles.typingText}>Agent is typing...</Text>
        </View>
      )}

      {/* Options Chips */}
      {chatStatus === "open" && activeOptions.length > 0 && (
        <View style={styles.chipsContainer}>
          <Text style={styles.chipsLabel}>Suggested Queries:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}
          >
            {activeOptions.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={styles.chip}
                onPress={() => handleOptionSelect(opt)}
              >
                <Text style={styles.chipText}>{opt.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Closed Banner or Footer Input */}
      {chatStatus === "closed" ? (
        <View style={[styles.closedBanner, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Text style={styles.closedText}>
            This support session has closed due to inactivity or resolution.
          </Text>
          <TouchableOpacity style={styles.restartBtn} onPress={handleRestartChat}>
            <Text style={styles.restartBtnText}>Start New Support Chat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom - 32, 12) },
          ]}
        >
          <TextInput
            style={styles.input}
            placeholder="Type your message here..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSendCustomMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={handleSendCustomMessage}
          >
            <Send size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FE",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  backButton: {
    padding: 8,
    marginLeft: -12,
  },
  headerInfo: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F2937",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    marginBottom: 16,
    maxWidth: "80%",
  },
  botRow: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  userRow: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  botBubble: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  userBubble: {
    backgroundColor: "#2FA561",
    borderTopRightRadius: 4,
  },
  agentBubble: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  botText: {
    color: "#1F2937",
  },
  userText: {
    color: "#FFFFFF",
  },
  timeText: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 4,
    marginHorizontal: 4,
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
  },
  chipsContainer: {
    paddingTop: 8,
    backgroundColor: "#F8F9FE",
  },
  chipsLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    marginLeft: 16,
    marginBottom: 6,
  },
  chipsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  chip: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    gap: 12,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    color: "#1F2937",
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2FA561",
    alignItems: "center",
    justifyContent: "center",
  },
  closedBanner: {
    padding: 24,
    backgroundColor: "#FEF3C7",
    borderTopWidth: 1,
    borderTopColor: "#FDE68A",
    alignItems: "center",
    justifyContent: "center",
  },
  closedText: {
    fontSize: 13,
    color: "#B45309",
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  restartBtn: {
    backgroundColor: "#D97706",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#B45309",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  restartBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  systemMessageContainer: {
    alignSelf: "center",
    marginVertical: 12,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  systemMessageText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },
});
