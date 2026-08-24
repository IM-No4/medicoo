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
    sendLiveChatMessage,
    startLiveChat,
} from "../../../../services/api/liveChat.api";
import { emitLiveChatMessage, onLiveChatAgentJoined, onLiveChatClosed, onLiveChatMessage } from "../../../../services/socketService";

const CATEGORIES = [
    { value: "delivery", label: "Order & Delivery" },
    { value: "payment", label: "Payments" },
    { value: "account", label: "My Account" },
    { value: "technical", label: "App Issue" },
    { value: "general", label: "Something else" },
];

export default function LiveChatScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const flatListRef = useRef<FlatList>(null);

    const [loading, setLoading] = useState(true);
    const [chat, setChat] = useState<LiveChat | null>(null);
    const [starting, setStarting] = useState(false);
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

    // Tapping a category is the whole "start chat" action now - one tap,
    // no separate subject field to fill in first. The category label
    // itself is used as the chat's subject line.
    const handleSelectCategory = async (cat: { value: string; label: string }) => {
        if (starting) return;
        setStarting(true);
        try {
            const newChat = await startLiveChat(cat.label, cat.value);
            setChat(newChat);
        } catch (err) {
            console.error("Error starting live chat:", err);
        } finally {
            setStarting(false);
        }
    };

    const handleSend = async () => {
        const text = inputText.trim();
        if (!text || !chat || chat.status === "closed") return;

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
                <ActivityIndicator size="large" color="#0FBBA1" />
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
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Chat</Text>
                    <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
                </View>
                {!pickerLocked ? (
                    <View style={{ width: 40 }} />
                ) : (
                    <TouchableOpacity onPress={handleEndChat} style={styles.endButton}>
                        <Text style={styles.endButtonText}>End Chat</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                ref={flatListRef}
                data={chat ? chat.messages : []}
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
                                    Hi! I'm your Medicoo Assistant 👋
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.messageContentRow, { marginTop: 10 }]}>
                            <View style={styles.botAvatarSpacer} />
                            <View style={[styles.bubble, styles.botBubble, styles.categoryListBubble]}>
                                <Text style={[styles.messageText, styles.botText, { marginBottom: 10 }]}>
                                    What do you need help with?
                                </Text>
                                {CATEGORIES.map((c, index) => {
                                    const isSelected = pickerLocked && chat?.category === c.value;
                                    return (
                                        <TouchableOpacity
                                            key={c.value}
                                            style={[
                                                styles.categoryCard,
                                                index === CATEGORIES.length - 1 && styles.categoryCardLast,
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
                                                {c.label}
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
                        {starting && <ActivityIndicator color="#0FBBA1" style={{ marginTop: 12 }} />}

                        {chat?.status === "closed" && (
                            <View style={styles.closedNotice}>
                                <Text style={styles.closedNoticeText}>Your last chat was closed. Start a new one below.</Text>
                            </View>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    chat?.status === "waiting" ? (
                        <Text style={styles.waitingText}>A support executive will join shortly.</Text>
                    ) : null
                }
            />

            {pickerLocked && (
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
                        placeholder="Type your message here..."
                        placeholderTextColor="#9CA3AF"
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={handleSend}
                        returnKeyType="send"
                    />
                    <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                        <Send size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8F9FE" },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" },
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
    backButton: { padding: 8, marginLeft: -12 },
    headerInfo: { alignItems: "center" },
    headerTitle: { fontSize: 16, fontWeight: "800", color: "#1F2937" },
    headerSubtitle: { fontSize: 11, color: "#6B7280", marginTop: 1 },
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
    waitingText: { textAlign: "center", color: "#9CA3AF", fontSize: 13, marginTop: 24 },
    messageRow: { marginBottom: 12, maxWidth: "80%" },
    agentRow: { alignSelf: "flex-start", alignItems: "flex-start" },
    userRow: { alignSelf: "flex-end", alignItems: "flex-end" },
    messageContentRow: { flexDirection: "row", alignItems: "flex-end", gap: 6, alignSelf: "flex-start" },
    bubble: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 },
    agentBubble: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 4, borderWidth: 1, borderColor: "#E5E7EB" },
    userBubble: { backgroundColor: "#0FBBA1", borderTopRightRadius: 4 },
    botBubble: { backgroundColor: "#EFF6FF", borderTopLeftRadius: 4, borderWidth: 1, borderColor: "#DBEAFE" },
    botAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#3B82F6",
        alignItems: "center",
        justifyContent: "center",
    },
    botAvatarSpacer: { width: 24 },
    messageText: { fontSize: 14, lineHeight: 20 },
    agentText: { color: "#1F2937" },
    userText: { color: "#FFFFFF" },
    botText: { color: "#1E40AF" },
    timeText: { fontSize: 10, color: "#9CA3AF", marginTop: 4, marginHorizontal: 4 },
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
    input: { flex: 1, height: 40, backgroundColor: "#F3F4F6", borderRadius: 20, paddingHorizontal: 16, color: "#1F2937", fontSize: 14 },
    sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#0FBBA1", alignItems: "center", justifyContent: "center" },
    closedNotice: { backgroundColor: "#F0FDF4", borderRadius: 12, padding: 12, marginBottom: 16 },
    closedNoticeText: { fontSize: 12, color: "#166534", fontWeight: "600" },
    categoryPickerBox: { paddingTop: 12, marginBottom: 12 },
    categoryListBubble: { maxWidth: "85%", paddingVertical: 12 },
    categoryCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        marginBottom: 8,
    },
    categoryCardLast: { marginBottom: 0 },
    categoryCardLocked: { opacity: 0.5 },
    categoryCardSelected: { opacity: 1, borderColor: "#3B82F6", backgroundColor: "#EFF6FF" },
    categoryCardText: { fontSize: 13, fontWeight: "600", color: "#374151" },
    categoryCardTextSelected: { color: "#1E40AF" },
});
