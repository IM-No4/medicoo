import { useMemo } from 'react';
import { useNavigation } from "@react-navigation/native";
import { Check, ChevronLeft, ChevronRight, Send, Sparkles } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Keyboard,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    LiveChat,
    LiveChatMessage,
    closeLiveChat,
    getActiveLiveChat,
    getLiveChatIntro,
    LiveChatIntro,
    sendLiveChatMessage,
    startLiveChat,
} from "../../../../services/api/liveChat.api";
import { emitLiveChatMessage, onLiveChatAgentJoined, onLiveChatClosed, onLiveChatMessage } from "../../../../services/socketService";
import { useTheme } from '../../../../theme/ThemeContext';
import type { ThemeColors } from '../../../../theme/colors';
import { useLanguage } from '../../../../i18n/LanguageContext';

const CATEGORIES = [
    { value: "delivery", label: "Order & Delivery" },
    { value: "payment", label: "Payments" },
    { value: "account", label: "My Account" },
    { value: "technical", label: "App Issue" },
    { value: "general", label: "Something else" },
];

export default function LiveChatScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const flatListRef = useRef<FlatList>(null);

    const [loading, setLoading] = useState(true);
    const [chat, setChat] = useState<LiveChat | null>(null);
    const [starting, setStarting] = useState(false);
    // Before the first message there is no session: the chosen topic and the message being sent live here only.
    const [selectedCategory, setSelectedCategory] = useState<{ value: string; label: string } | null>(null);
    const [draft, setDraft] = useState<LiveChatMessage[]>([]);
    const [sendError, setSendError] = useState("");
    // The welcome and the topics come from the server; these are only what shows if it cannot be reached.
    const [intro, setIntro] = useState<LiveChatIntro | null>(null);
    useEffect(() => {
        getLiveChatIntro().then(setIntro).catch(() => undefined);
    }, []);
    const topics = intro?.categories?.length ? intro.categories : CATEGORIES;
    const [inputText, setInputText] = useState("");
    const chatRef = useRef<LiveChat | null>(null);
    chatRef.current = chat;

    // The category picker is always part of this same chat screen (instead
    // of a separate pre-chat form screen) and always stays visible as the
    // first thing in the chat history, chronologically before any real
    // messages - it just becomes non-interactive once a chat is active,
    // rather than disappearing.
    const pickerLocked = !!chat && chat.status !== "closed";

    // KeyboardAvoidingView's built-in behavior wasn't reliably resizing/
    // repositioning this screen (Android's adjustResize isn't actually
    // kicking in here, likely due to edge-to-edge display), so this tracks
    // the keyboard's real, OS-reported height directly instead of guessing.
    // The footer gets pushed up by exactly that amount via marginBottom -
    // a plain flex sibling shrinks to make room, no animation heuristics
    // from KeyboardAvoidingView involved at all.
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

    const loadActiveChat = async () => {
        try {
            const active = await getActiveLiveChat();
            setChat(active);
        } catch (err) {
            console.error("Error loading active live chat:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadActiveChat();
    }, []);

    useEffect(() => {
        const unsubMessage = onLiveChatMessage(({ chatId, message }) => {
            if (chatRef.current && chatRef.current._id === chatId) {
                setChat((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : prev));
            }
        });
        const unsubAgentJoined = onLiveChatAgentJoined(({ chatId }) => {
            if (chatRef.current && chatRef.current._id === chatId) {
                setChat((prev) => (prev ? { ...prev, status: "open" } : prev));
            }
        });
        const unsubClosed = onLiveChatClosed(({ chatId }) => {
            if (chatRef.current && chatRef.current._id === chatId) {
                setChat((prev) => (prev ? { ...prev, status: "closed" } : prev));
            }
        });
        return () => {
            unsubMessage();
            unsubAgentJoined();
            unsubClosed();
        };
    }, []);

    // Choosing a topic only marks it - nothing is created until the customer sends a message.
    const handleSelectCategory = (cat: { value: string; label: string }) => {
        if (starting) return;
        setSelectedCategory((prev) => (prev?.value === cat.value ? null : cat));
    };

    const handleSend = async () => {
        const text = inputText.trim();
        if (!text || starting) return;

        // No active session yet (first message, or the last chat ended): sending the message is what starts one.
        if (!chat || chat.status === "closed") {
            const topic = selectedCategory || { value: "general", label: "Something else" };
            setDraft([{ _id: `local-${Date.now()}`, sender: "user", text, timestamp: new Date().toISOString() }]);
            setInputText("");
            setSendError("");
            setStarting(true);
            try {
                const newChat = await startLiveChat(topic.label, topic.value, text);
                setChat(newChat);
                setDraft([]);
            } catch (err) {
                console.error("Error starting live chat:", err);
                setDraft([]);
                setInputText(text);
                setSendError("We couldn't send your message. Please try again.");
            } finally {
                setStarting(false);
            }
            return;
        }

        const optimistic: LiveChatMessage = {
            _id: `local-${Date.now()}`,
            sender: "user",
            text,
            timestamp: new Date().toISOString(),
        };
        setChat((prev) => (prev ? { ...prev, messages: [...prev.messages, optimistic] } : prev));
        setInputText("");

        const sentOverSocket = emitLiveChatMessage(chat._id, text);
        if (!sentOverSocket) {
            try {
                await sendLiveChatMessage(chat._id, text);
            } catch (err) {
                console.error("Error sending live chat message:", err);
            }
        }
    };

    const handleEndChat = async () => {
        if (!chat) return;
        try {
            const closed = await closeLiveChat(chat._id);
            setChat(closed);
        } catch (err) {
            console.error("Error closing live chat:", err);
        }
    };

    const renderMessage = ({ item }: { item: LiveChatMessage }) => {
        const isBot = item.sender === "bot";
        const isAgent = item.sender === "agent";
        const isLeftAligned = isBot || isAgent;
        return (
            <View style={[styles.messageRow, isLeftAligned ? styles.agentRow : styles.userRow]}>
                <View style={styles.messageContentRow}>
                    {isBot && (
                        <View style={styles.botAvatar}>
                            <Sparkles size={12} color="#FFFFFF" />
                        </View>
                    )}
                    <View
                        style={[
                            styles.bubble,
                            isBot ? styles.botBubble : isAgent ? styles.agentBubble : styles.userBubble,
                        ]}
                    >
                        <Text
                            style={[
                                styles.messageText,
                                isBot ? styles.botText : isAgent ? styles.agentText : styles.userText,
                            ]}
                        >
                            {item.text}
                        </Text>
                    </View>
                </View>
                <Text style={styles.timeText}>
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    const headerSubtitle = !pickerLocked
        ? (chat?.status === "closed" ? "Start a new conversation" : "What do you need help with?")
        : chat!.status === "bot"
            ? "Chatting with Medicoo Assistant"
            : chat!.status === "waiting"
                ? "Waiting for a support executive..."
                : "Connected to support";

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>{t('chat')}</Text>
                    <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
                </View>
                {!pickerLocked ? (
                    <View style={{ width: 40 }} />
                ) : (
                    <TouchableOpacity onPress={handleEndChat} style={styles.endButton}>
                        <Text style={styles.endButtonText}>{t('end_chat')}</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                ref={flatListRef}
                data={[...(chat ? chat.messages : []), ...draft]}
                renderItem={renderMessage}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.chatContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                ListHeaderComponent={
                    <View style={styles.categoryPickerBox}>
                        <View style={styles.messageContentRow}>
                            <View style={styles.botAvatar}>
                                <Sparkles size={12} color="#FFFFFF" />
                            </View>
                            <View style={[styles.bubble, styles.botBubble]}>
                                <Text style={[styles.messageText, styles.botText]}>
                                    {intro?.greeting || "Hi! I'm your Medicoo Assistant 👋"}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.messageContentRow, { marginTop: 10 }]}>
                            <View style={styles.botAvatarSpacer} />
                            <View style={[styles.bubble, styles.botBubble, styles.categoryListBubble]}>
                                <Text style={[styles.messageText, styles.botText, { marginBottom: 10 }]}>
                                    {intro?.prompt || t('what_do_you_need_help_with')}
                                </Text>
                                {topics.map((c, index) => {
                                    const isSelected = pickerLocked ? chat?.category === c.value : selectedCategory?.value === c.value;
                                    return (
                                        <TouchableOpacity
                                            key={c.value}
                                            style={[
                                                styles.categoryCard,
                                                index === topics.length - 1 && styles.categoryCardLast,
                                                pickerLocked && styles.categoryCardLocked,
                                                isSelected && styles.categoryCardSelected,
                                            ]}
                                            onPress={() => handleSelectCategory(c)}
                                            disabled={pickerLocked || starting}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[
                                                    styles.categoryCardText,
                                                    isSelected && styles.categoryCardTextSelected,
                                                ]}
                                            >
                                                {t(c.label)}
                                            </Text>
                                            {isSelected ? (
                                                <Check size={16} color="#3B82F6" />
                                            ) : (
                                                <ChevronRight size={16} color={pickerLocked ? "#D1D5DB" : "#9CA3AF"} />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                        {!!sendError && <Text style={[styles.waitingText, { color: "#DC2626" }]}>{sendError}</Text>}

                        {chat?.status === "closed" && (
                            <View style={styles.closedNotice}>
                                <Text style={styles.closedNoticeText}>{t('your_last_chat_was_closed_start_a_new')}</Text>
                            </View>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    chat?.status === "waiting" ? (
                        <Text style={styles.waitingText}>{t('a_support_executive_will_join_shortly')}</Text>
                    ) : null
                }
            />

            {(
                <View
                    style={[
                        styles.footer,
                        {
                            // On Android's edge-to-edge display, the keyboard's
                            // reported height doesn't include the transparent
                            // gesture-nav bar overlaying the very bottom of the
                            // screen, so the push falls short by exactly that
                            // inset - add it back in when the keyboard is up.
                            paddingBottom: keyboardHeight > 0 ? 12 : insets.bottom + 12,
                            marginBottom: keyboardHeight > 0 ? keyboardHeight + insets.bottom : 0,
                        },
                    ]}
                >
                    <TextInput
                        style={styles.input}
                        editable={!starting}
                        placeholder={t('type_your_message_here')}
                        placeholderTextColor={theme.textMuted}
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={handleSend}
                        returnKeyType="send"
                    />
                    <TouchableOpacity style={[styles.sendBtn, starting && { opacity: 0.5 }]} onPress={handleSend} disabled={starting}>
                        {starting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Send size={18} color="#FFFFFF" />}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: c.card },
    // Same header bar recipe as the rest of the Profile screens - white bar
    // + shadow instead of a hard border. The title+subtitle+End-Chat layout
    // here is intentionally different content, not part of that unification.
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
    backButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginLeft: -8 },
    headerInfo: { alignItems: "center" },
    headerTitle: { fontSize: 16, fontWeight: "800", color: c.text },
    headerSubtitle: { fontSize: 11, color: c.textSecondary, marginTop: 1 },
    endButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: "#DC2626",
        shadowColor: "#DC2626",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
    },
    endButtonText: { fontSize: 13, fontWeight: "800", color: "#FFFFFF" },
    chatContent: { padding: 16, paddingBottom: 24, flexGrow: 1 },
    waitingText: { textAlign: "center", color: c.textMuted, fontSize: 13, marginTop: 24 },
    messageRow: { marginBottom: 8, maxWidth: "80%" },
    agentRow: { alignSelf: "flex-start", alignItems: "flex-start" },
    userRow: { alignSelf: "flex-end", alignItems: "flex-end" },
    messageContentRow: { flexDirection: "row", alignItems: "flex-end", gap: 6, alignSelf: "flex-start" },
    bubble: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 18,
        ...Platform.select({
            ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
            android: { elevation: 1 },
        }),
    },
    agentBubble: { backgroundColor: c.card, borderTopLeftRadius: 4, borderWidth: 1, borderColor: c.border },
    userBubble: { backgroundColor: "#475569", borderTopRightRadius: 4 },
    botBubble: { backgroundColor: c.infoBg, borderTopLeftRadius: 4, borderWidth: 1, borderColor: c.isDark ? c.border : "#DBEAFE" },
    botAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#3B82F6",
        alignItems: "center",
        justifyContent: "center",
    },
    botAvatarSpacer: { width: 24 },
    messageText: { fontSize: 13, lineHeight: 18 },
    agentText: { color: c.text },
    userText: { color: "#FFFFFF" },
    botText: { color: c.info },
    timeText: { fontSize: 10, color: c.textMuted, marginTop: 4, marginHorizontal: 4 },
    footer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 12,
        backgroundColor: c.card,
        gap: 12,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -1 }, shadowOpacity: 0.03, shadowRadius: 4 },
            android: { elevation: 3 },
        }),
    },
    input: { flex: 1, height: 40, backgroundColor: c.cardSecondary, borderRadius: 20, borderWidth: 1, borderColor: c.border, paddingHorizontal: 16, color: c.text, fontSize: 14 },
    sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center" },
    closedNotice: { backgroundColor: c.successBg, borderRadius: 12, padding: 12, marginBottom: 16 },
    closedNoticeText: { fontSize: 12, color: c.success, fontWeight: "600" },
    categoryPickerBox: { paddingTop: 12, marginBottom: 12 },
    categoryListBubble: { maxWidth: "85%", paddingVertical: 12 },
    categoryCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: c.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: c.border,
        marginBottom: 8,
    },
    categoryCardLast: { marginBottom: 0 },
    categoryCardLocked: { opacity: 0.5 },
    categoryCardSelected: { opacity: 1, borderColor: "#3B82F6", backgroundColor: c.infoBg },
    categoryCardText: { fontSize: 13, fontWeight: "600", color: c.text },
    categoryCardTextSelected: { color: c.info },
});
