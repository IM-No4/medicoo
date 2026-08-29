import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Bot, ChevronLeft, History, Send } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    getHealthAssistantSessionHistory,
    sendHealthAssistantQuery,
} from '../../services/api/healthAssistant.api';
import { getProfileDetails } from '../../services/api/user.api';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    disclaimer?: string | null;
    quickReplies?: string[];
    failed?: boolean;
}

const NOT_A_DOCTOR_DISCLAIMER = "Just so you know, I'm here to support you, not replace a doctor - please reach out to one for anything serious.";

const SUGGESTIONS = [
    { label: 'Quick health risk assessment', action: 'openAssessment' as const },
    { label: 'Check my recent vitals', prompt: 'Can you check my recent vitals for me?' },
    { label: 'My medication schedule', prompt: 'What does my current medication schedule look like?' },
    { label: 'General wellness tips', prompt: 'Give me a few general wellness tips.' },
];

function getTimeOfDayGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

function buildGreeting(name?: string): ChatMessage {
    const greeting = getTimeOfDayGreeting();
    return {
        id: 'greeting',
        role: 'assistant',
        text: name
            ? `${greeting}, ${name}! How can I help you today?`
            : `${greeting}! How can I help you today?`,
        disclaimer: NOT_A_DOCTOR_DISCLAIMER,
    };
}

export default function AIAssistantChatScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const flatListRef = useRef<FlatList>(null);

    const [messages, setMessages] = useState<ChatMessage[]>([buildGreeting()]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const sessionIdRef = useRef<string | undefined>(undefined);

    // Upgrade the generic greeting to a personalized one once the profile
    // loads, rather than blocking the first paint on a network call.
    useEffect(() => {
        getProfileDetails()
            .then((profile) => {
                if (profile?.name) {
                    setMessages((prev) =>
                        prev[0]?.id === 'greeting' ? [buildGreeting(profile.name), ...prev.slice(1)] : prev
                    );
                }
            })
            .catch((e) => console.warn('Failed to load profile for greeting personalization:', e));
    }, []);

    // KeyboardAvoidingView's Android "height" behavior doesn't reliably
    // reset back to its original size once the keyboard hides, leaving the
    // input stuck mid-way up the screen - tracking the keyboard's real,
    // OS-reported height directly and pushing content up via marginBottom
    // resets deterministically instead (same fix already used in
    // LoginScreen/LiveChatScreen/OrderSupportScreen).
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const showSub = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
        const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
        }
    }, [messages.length]);

    const sendMessageText = async (text: string) => {
        if (!text || sending) return;

        const userMessageId = `user-${Date.now()}`;
        setMessages((prev) => [...prev, { id: userMessageId, role: 'user', text }]);
        setSending(true);

        try {
            const res = await sendHealthAssistantQuery(text, sessionIdRef.current);
            sessionIdRef.current = res.sessionId;
            setMessages((prev) => [
                ...prev,
                {
                    id: res.interactionId || `assistant-${Date.now()}`,
                    role: 'assistant',
                    text: res.response,
                    disclaimer: res.disclaimer,
                    quickReplies: res.quickReplies,
                },
            ]);
        } catch (error) {
            console.warn('Failed to get health assistant response:', error);
            // Mark the message that was just sent as failed, with a retry
            // affordance on it - previously this restored the text into the
            // input box, which left a confusing duplicate (the message
            // already shows in the chat) and no visible sign anything went
            // wrong.
            setMessages((prev) =>
                prev.map((m) => (m.id === userMessageId ? { ...m, failed: true } : m))
            );
        } finally {
            setSending(false);
        }
    };

    const handleRetry = (message: ChatMessage) => {
        setMessages((prev) => prev.filter((m) => m.id !== message.id));
        sendMessageText(message.text);
    };

    const handleSend = () => {
        const text = input.trim();
        if (!text) return;
        setInput('');
        sendMessageText(text);
    };

    const handleSelectSuggestion = (prompt: string) => {
        sendMessageText(prompt);
    };

    const handleSelectSession = async (sessionId: string) => {
        setLoadingHistory(true);
        try {
            const interactions = await getHealthAssistantSessionHistory(sessionId);
            const loaded: ChatMessage[] = interactions.flatMap((interaction) => [
                { id: `${interaction.id}-q`, role: 'user' as const, text: interaction.query },
                { id: `${interaction.id}-a`, role: 'assistant' as const, text: interaction.response },
            ]);
            sessionIdRef.current = sessionId;
            setMessages(loaded.length > 0 ? loaded : [buildGreeting()]);
        } catch (error) {
            console.warn('Failed to load conversation history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    // HealthAssistantHistoryScreen navigates back here with this param when
    // a past conversation is picked. Clearing it after handling prevents
    // re-triggering on a later focus/param change.
    useEffect(() => {
        const resumeSessionId = route.params?.resumeSessionId;
        if (resumeSessionId) {
            handleSelectSession(resumeSessionId);
            navigation.setParams({ resumeSessionId: undefined });
        }
    }, [route.params?.resumeSessionId]);

    // HealthRiskAssessmentScreen's "Discuss this with Medo" navigates back
    // here with this param, same pattern as resumeSessionId above.
    useEffect(() => {
        const seedMessage = route.params?.seedMessage;
        if (seedMessage) {
            sendMessageText(seedMessage);
            navigation.setParams({ seedMessage: undefined });
        }
    }, [route.params?.seedMessage]);

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isMine = item.role === 'user';
        // Only offer starter suggestions on the greeting bubble itself,
        // and only while the conversation hasn't actually started yet -
        // once there's a real exchange they'd just be clutter.
        const showSuggestions = item.id === 'greeting' && messages.length === 1;

        return (
            <View style={[styles.messageRow, isMine ? styles.messageRowRight : styles.messageRowLeft]}>
                <View style={[styles.messageBubble, isMine ? styles.bubbleRight : styles.bubbleLeft]}>
                    <Text style={[styles.messageText, isMine ? styles.textRight : styles.textLeft]}>
                        {item.text}
                    </Text>

                    {showSuggestions && (
                        <View style={styles.suggestionsWrap}>
                            {SUGGESTIONS.map((s) => (
                                <TouchableOpacity
                                    key={s.label}
                                    style={styles.suggestionButton}
                                    activeOpacity={0.7}
                                    onPress={() =>
                                        s.action === 'openAssessment'
                                            ? navigation.navigate('HealthRiskAssessment')
                                            : handleSelectSuggestion(s.prompt!)
                                    }
                                >
                                    <Text style={styles.suggestionButtonText}>{s.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {!showSuggestions && !!item.quickReplies?.length && (
                        <View style={styles.suggestionsWrap}>
                            {item.quickReplies.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={styles.suggestionButton}
                                    activeOpacity={0.7}
                                    onPress={() => handleSelectSuggestion(option)}
                                >
                                    <Text style={styles.suggestionButtonText}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
                {!!item.disclaimer && (
                    <Text style={styles.disclaimerText}>{item.disclaimer}</Text>
                )}
                {item.failed && (
                    <TouchableOpacity onPress={() => handleRetry(item)} activeOpacity={0.7}>
                        <Text style={styles.failedText}>Couldn't send · Tap to retry</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color="#111827" />
                </TouchableOpacity>

                <View style={styles.headerInfo}>
                    <View style={styles.avatarHeader}>
                        <Bot size={18} color="#0FBBA1" />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Medo</Text>
                        <Text style={styles.headerSubtitle}>Health assistant</Text>
                    </View>
                </View>

                <TouchableOpacity onPress={() => navigation.navigate('HealthAssistantHistory')} style={styles.iconButton}>
                    <History size={20} color="#4B5563" />
                </TouchableOpacity>
            </View>

            <View style={[styles.flexOne, { marginBottom: keyboardHeight > 0 ? keyboardHeight + insets.bottom : 0 }]}>
                {loadingHistory ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#0FBBA1" />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        style={styles.flexOne}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.chatContent}
                    />
                )}

                {sending && (
                    <View style={styles.typingRow}>
                        <ActivityIndicator size="small" color="#0FBBA1" />
                        <Text style={styles.typingText}>Medo is typing...</Text>
                    </View>
                )}

                <View style={[styles.inputContainer, { paddingBottom: (keyboardHeight > 0 ? 0 : insets.bottom) + 12 }]}>
                    <TextInput
                        style={styles.input}
                        placeholder="Ask Medo anything..."
                        placeholderTextColor="#9CA3AF"
                        value={input}
                        onChangeText={setInput}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, (!input.trim() || sending) && styles.sendButtonDisabled]}
                        onPress={handleSend}
                        disabled={!input.trim() || sending}
                    >
                        <Send size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    flexOne: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 16,
        backgroundColor: '#fff',
        gap: 12,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
            android: { elevation: 2 },
        }),
    },
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
    headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatarHeader: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E6FBF7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
    headerSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 1 },
    iconButton: { padding: 4 },

    chatContent: { padding: 16, paddingBottom: 24, gap: 16, flexGrow: 1 },

    messageRow: { maxWidth: '85%' },
    messageRowLeft: { alignSelf: 'flex-start' },
    messageRowRight: { alignSelf: 'flex-end' },

    messageBubble: {
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    bubbleLeft: { backgroundColor: '#fff', borderBottomLeftRadius: 4 },
    bubbleRight: { backgroundColor: '#0FBBA1', borderBottomRightRadius: 4 },
    messageText: { fontSize: 15, lineHeight: 22 },
    textLeft: { color: '#1F2937' },
    textRight: { color: '#fff' },

    disclaimerText: {
        fontSize: 11,
        color: '#9CA3AF',
        fontStyle: 'italic',
        marginTop: 4,
        marginHorizontal: 4,
    },
    failedText: {
        fontSize: 12,
        color: '#DC2626',
        fontWeight: '600',
        marginTop: 4,
        marginHorizontal: 4,
        textAlign: 'right',
    },

    suggestionsWrap: {
        gap: 8,
        marginTop: 12,
    },
    suggestionButton: {
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: '#0FBBA1',
    },
    suggestionButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    typingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    typingText: { fontSize: 12, color: '#6B7280' },

    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingTop: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 10,
    },
    input: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        paddingTop: 10,
        fontSize: 15,
        color: '#1F2937',
        maxHeight: 100,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#0FBBA1',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    sendButtonDisabled: { backgroundColor: '#D1D5DB' },
});
