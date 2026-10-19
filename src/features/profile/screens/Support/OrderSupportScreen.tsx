import { useMemo } from 'react';
import { useNavigation, useRoute } from "@react-navigation/native";
import { ChevronLeft, Info, Send } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Keyboard,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getOrderChatOptions, sendOrderChatMessage, getOrderChatHistory, restartOrderChat, sendOrderChatFeedback } from "../../../../services/api";
import { useTheme } from '../../../../theme/ThemeContext';
import { AdaptiveStatusBar } from '../../../../components/ThemedStatusBar';
import type { ThemeColors } from '../../../../theme/colors';
import { useLanguage } from '../../../../i18n/LanguageContext';
import ItemIssueFlow from './ItemIssueFlow';

interface Message {
  id: string;
  sender: "bot" | "user" | "agent";
  text: string;
  timestamp: Date;
}

interface Option {
  id: string;
  text: string;
  /** 'item_issue' opens the guided "problem with my items" steps in the chat. */
  flow?: string;
}

export default function OrderSupportScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
  // Chat support for an order lasts as long as a return can still be requested; after that it is closed and nothing can be sent.
  const [supportClosed, setSupportClosed] = useState(false);
  // The server decides the cards and the question above them (order related), and whether the guided item steps are offered.
  const [optionsPrompt, setOptionsPrompt] = useState("");
  const [flowActive, setFlowActive] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");

  // KeyboardAvoidingView's built-in behavior wasn't reliably resizing/
  // repositioning this screen (Android's adjustResize isn't actually
  // kicking in here, likely due to edge-to-edge display), so this tracks
  // the keyboard's real, OS-reported height directly instead of guessing.
  // The footer gets pushed up by exactly that amount via marginBottom - a
  // plain flex sibling shrinks to make room, no animation heuristics from
  // KeyboardAvoidingView involved at all.
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Whenever a message arrives (ours, the assistant's or the team's) or the steps open, show the latest of it.
  useEffect(() => {
    if (loading) return;
    const first = setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 60);
    const second = setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 350); // after the rows have measured
    return () => {
      clearTimeout(first);
      clearTimeout(second);
    };
  }, [loading, messages.length, typing, flowActive, activeOptions.length]);

  // Only used if the server's cards cannot be fetched, so the question above is never left without a choice.
  const FALLBACK_OPTIONS: Option[] = [
    { id: "status", text: "Where is my order?" },
    { id: "payment", text: "Payment or refund status" },
  ];

  const loadChatData = async () => {
    try {
      const historyData = await getOrderChatHistory(orderId);
      setChatStatus(historyData.status || "open");
      setSupportClosed(!!historyData.supportClosed);
      setSupportMessage(historyData.supportMessage || "");
      
      const mappedMessages = (historyData.messages || []).map((m: any, idx: number) => ({
        id: m._id || String(idx),
        sender: m.sender,
        text: m.text,
        timestamp: new Date(m.timestamp)
      }));
      setMessages(mappedMessages);

      if (historyData.status === "open" && !historyData.supportClosed) {
        try {
          const optionsData = await getOrderChatOptions(orderId);
          setActiveOptions(optionsData.options?.length ? optionsData.options : FALLBACK_OPTIONS);
          setOptionsPrompt(optionsData.prompt || "");
        } catch {
          setActiveOptions(FALLBACK_OPTIONS);
        }
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

    // "Problem with my items" is not a question to answer: it opens the steps (items, what is wrong, photos).
    if (option.flow === "item_issue") {
      setMessages((prev) => [...prev, { id: String(Date.now()), sender: "user", text: option.text, timestamp: new Date() }]);
      setFlowActive(true);
      return;
    }

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

  // "Start a new support chat": shows a fresh greeting and this order's cards right away. The session itself begins with the
  // customer's next message, so we use what the server returned instead of reloading the old, closed chat.
  const handleRestartChat = async () => {
    try {
      const fresh = await restartOrderChat(orderId);
      // The earlier conversation stays; the new one continues underneath it.
      setMessages((prev) => [
        ...prev,
        ...(fresh.messages || []).map((m: any, idx: number) => ({ id: `fresh-${Date.now()}-${idx}`, sender: m.sender, text: m.text, timestamp: new Date(m.timestamp) })),
      ]);
      setChatStatus("open");
      setSupportClosed(false);
      setFlowActive(false);
      const optionsData = await getOrderChatOptions(orderId);
      setActiveOptions(optionsData.options?.length ? optionsData.options : FALLBACK_OPTIONS);
      setOptionsPrompt(optionsData.prompt || "");
    } catch (err: any) {
      if (err?.response?.data?.code === "SUPPORT_WINDOW_CLOSED") {
        setSupportClosed(true);
        setSupportMessage(err.response.data.message || "");
        setActiveOptions([]);
      } else {
        console.error("Error restarting support chat:", err);
      }
    }
  };

  // The options belong to the question the assistant asks: they sit inside that message, until the customer answers.
  const optionsMessageId = (() => {
    if (supportClosed || flowActive || chatStatus !== "open" || activeOptions.length === 0) return null;
    let greetingAt = -1;
    messages.forEach((m, i) => {
      if (m.sender === "bot" && m.text.startsWith("Hi there! I am your Medicoo Support Assistant")) greetingAt = i;
    });
    const last = messages[messages.length - 1];
    if (last?.sender === "bot" && last.text.includes("Pick one below or type your question")) return last.id; // "I need more help"
    if (greetingAt < 0) return null;
    if (last.sender !== "bot" || messages.slice(greetingAt).some((m) => m.sender === "user" || m.sender === "agent")) return null;
    return last.id;
  })();

  // "Was this helpful?" goes under the assistant's answer to a question, while it is the latest thing in the chat.
  const feedbackMessageId = (() => {
    if (supportClosed || flowActive || typing || chatStatus !== "open" || messages.length < 2) return null;
    const last = messages[messages.length - 1];
    const before = messages[messages.length - 2];
    if (last.sender !== "bot" || before.sender !== "user") return null;
    if (/joined the chat|in queue|Pick one below|chat is now closed/i.test(last.text)) return null;
    return last.id;
  })();

  const handleFeedback = async (helpful: boolean) => {
    try {
      const data = await sendOrderChatFeedback(orderId, helpful);
      const added = (data.messages || []).map((m: any, idx: number) => ({ id: `fb-${Date.now()}-${idx}`, sender: m.sender, text: m.text, timestamp: new Date(m.timestamp) }));
      setMessages((prev) => [...prev, ...added]);
      if (data.status === "closed") {
        setChatStatus("closed");
        setActiveOptions([]);
      } else {
        const optionsData = await getOrderChatOptions(orderId);
        setActiveOptions(optionsData.options?.length ? optionsData.options : FALLBACK_OPTIONS);
        setOptionsPrompt(optionsData.prompt || "");
      }
    } catch (err) {
      console.error("Error saving chat feedback:", err);
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

    if (isBot && item.text === "New chat started") {
      return (
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>New chat started</Text>
          <View style={styles.dividerLine} />
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
          {item.id === optionsMessageId ? (
            <View style={styles.optionsInMessage}>
              {activeOptions.map((opt) => (
                <TouchableOpacity key={opt.id} style={styles.optionRow} onPress={() => handleOptionSelect(opt)} activeOpacity={0.8}>
                  <Text style={styles.optionText}>{opt.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
        <Text style={styles.timeText}>
          {item.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        {item.id === feedbackMessageId ? (
          <View style={styles.feedbackRow}>
            <Text style={styles.feedbackLabel}>Was this helpful?</Text>
            <TouchableOpacity style={styles.feedbackBtn} onPress={() => handleFeedback(true)} activeOpacity={0.8}>
              <Text style={styles.feedbackBtnText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.feedbackBtn} onPress={() => handleFeedback(false)} activeOpacity={0.8}>
              <Text style={styles.feedbackBtnText}>I need more help</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <AdaptiveStatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdaptiveStatusBar barStyle="dark-content" backgroundColor="#fff" />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{t('order_help')}</Text>
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
        extraData={`${optionsMessageId}|${feedbackMessageId}`}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          flowActive ? (
            <ItemIssueFlow
              orderId={orderId}
              onCancel={() => setFlowActive(false)}
              onSent={() => {
                setFlowActive(false);
                loadChatData(); // our reply (and the team's, later) arrives in this chat
              }}
            />
          ) : null
        }
      />

      {/* Typing Loader */}
      {typing && (
        <View style={styles.typingContainer}>
          <ActivityIndicator size="small" color="#10B981" />
          <Text style={styles.typingText}>{t('agent_is_typing')}</Text>
        </View>
      )}

      {/* Closed Banner or Footer Input */}
      {supportClosed ? (
        <View style={[styles.closedBanner, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.closedCard}>
            <View style={styles.closedIconWrap}>
              <Info size={18} color={theme.warning} />
            </View>
            <Text style={styles.closedText}>
              {supportMessage || "Chat support for this order has ended."}
            </Text>
          </View>
          <View style={[styles.footer, { paddingHorizontal: 0, opacity: 0.45 }]}>
            <TextInput style={styles.input} editable={false} placeholder="Chat support for this order has ended" placeholderTextColor={theme.textMuted} />
            <View style={[styles.sendBtn, { backgroundColor: theme.textMuted }]}>
              <Send size={18} color="#FFFFFF" />
            </View>
          </View>
        </View>
      ) : chatStatus === "closed" ? (
        <View style={[styles.closedBanner, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Text style={styles.endedTitle}>This chat has ended</Text>
          <Text style={styles.endedSub}>Need anything else about this order? Start a new chat.</Text>
          <TouchableOpacity style={styles.restartBtn} onPress={handleRestartChat} activeOpacity={0.85}>
            <Text style={styles.restartBtnText}>Start new chat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View
          style={[
            styles.footer,
            {
              // On Android's edge-to-edge display, the keyboard's reported
              // height doesn't include the transparent gesture-nav bar
              // overlaying the very bottom of the screen, so the push falls
              // short by exactly that inset - add it back in when the
              // keyboard is up.
              paddingBottom: keyboardHeight > 0 ? 12 : insets.bottom + 12,
              marginBottom: keyboardHeight > 0 ? keyboardHeight + insets.bottom : 0,
            },
          ]}
        >
          <TextInput
            style={styles.input}
            placeholder={t('type_your_message_here')}
            placeholderTextColor={theme.textMuted}
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
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: c.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: c.card,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  headerInfo: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: c.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: c.textSecondary,
    marginTop: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    marginBottom: 8,
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
    backgroundColor: c.card,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: c.border,
  },
  userBubble: {
    backgroundColor: "#475569",
    borderTopRightRadius: 4,
  },
  agentBubble: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  botText: {
    color: c.text,
  },
  userText: {
    color: "#FFFFFF",
  },
  timeText: {
    fontSize: 10,
    color: c.textMuted,
    marginTop: 2,
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
    color: c.textSecondary,
    fontStyle: "italic",
  },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 16, paddingHorizontal: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: c.border },
  dividerText: { marginHorizontal: 10, fontSize: 11, fontWeight: "600", color: c.textMuted },
  feedbackRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 6 },
  feedbackLabel: { fontSize: 12, color: c.textSecondary, fontWeight: "600" },
  feedbackBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.card },
  feedbackBtnText: { fontSize: 12, fontWeight: "600", color: c.text },
  optionsInMessage: { marginTop: 10, gap: 8 },
  optionRow: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: c.border, backgroundColor: c.cardSecondary },
  optionText: { fontSize: 14, fontWeight: "600", color: c.text },
  chipsContainer: {
    paddingTop: 8,
    backgroundColor: c.cardSecondary,
  },
  chipsLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: c.textSecondary,
    marginLeft: 16,
    marginBottom: 6,
  },
  chipsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  chip: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
    color: c.textSecondary,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: c.card,
    borderTopWidth: 1,
    borderTopColor: c.border,
    gap: 12,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: c.cardSecondary,
    borderRadius: 20,
    paddingHorizontal: 16,
    color: c.text,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  closedBanner: {
    padding: 16,
    backgroundColor: c.card,
    borderTopWidth: 1,
    borderTopColor: c.borderLight,
  },
  endedTitle: { fontSize: 15, fontWeight: "700", color: c.text, textAlign: "center" },
  endedSub: { fontSize: 12, color: c.textSecondary, textAlign: "center", marginTop: 4, marginBottom: 14 },
  closedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: c.warningBg,
    borderWidth: 1,
    borderColor: "#FEF3C7",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  closedIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: c.warningBg,
    alignItems: "center",
    justifyContent: "center",
  },
  closedText: {
    flex: 1,
    fontSize: 13,
    color: c.warning,
    fontWeight: "500",
    lineHeight: 18,
  },
  restartBtn: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  restartBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  systemMessageContainer: {
    alignSelf: "center",
    marginVertical: 12,
    backgroundColor: c.cardSecondary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
  },
  systemMessageText: {
    fontSize: 12,
    color: c.textSecondary,
    fontWeight: "600",
  },
});
