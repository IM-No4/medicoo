import { useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, MoreVertical, Paperclip, Phone, Send, Video } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { executeAction } from '../../actions/ActionExecutor';
// Force change to trigger re-bundle 2026-02-03 19:15 


export default function DoctorChatScreen() {
    const insets = useSafeAreaInsets();
    const route = useRoute<any>();
    const { appointment } = route.params || {};
    const flatListRef = useRef<FlatList>(null);

    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([
        { id: '1', text: 'Hello, I have a severe headache.', sender: 'patient', time: '10:00 AM' },
        { id: '2', text: 'Hi, how long have you been feeling this way?', sender: 'doctor', time: '10:01 AM' },
        { id: '3', text: 'For about 2 days now. It gets worse with light.', sender: 'patient', time: '10:02 AM' },
    ]);

    const patientName = appointment?.patientName || 'Patient';

    const sendMessage = () => {
        if (!message.trim()) return;

        const newMessage = {
            id: Date.now().toString(),
            text: message,
            sender: 'doctor',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newMessage]);
        setMessage('');

        // Scroll to bottom
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const renderMessageItem = ({ item }: { item: any }) => {
        const isDoctor = item.sender === 'doctor';
        return (
            <View style={[styles.messageRow, isDoctor ? styles.messageRowRight : styles.messageRowLeft]}>
                {!isDoctor && (
                    <View style={styles.avatarSmall}>
                        <Text style={styles.avatarTextSmall}>{patientName.charAt(0)}</Text>
                    </View>
                )}
                <View style={[
                    styles.messageBubble,
                    isDoctor ? styles.bubbleRight : styles.bubbleLeft
                ]}>
                    <Text style={[styles.messageText, isDoctor ? styles.textRight : styles.textLeft]}>
                        {item.text}
                    </Text>
                    <Text style={[styles.timeText, isDoctor ? styles.timeRight : styles.timeLeft]}>
                        {item.time}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity onPress={() => executeAction('GO_BACK')} style={styles.backButton}>
                    <ChevronLeft size={24} color="#1F2937" />
                </TouchableOpacity>

                <View style={styles.headerInfo}>
                    <View style={styles.avatarHeader}>
                        <Text style={styles.avatarTextHeader}>{patientName.charAt(0)}</Text>
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>{patientName}</Text>
                        <Text style={styles.headerStatus}>Online</Text>
                    </View>
                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Phone size={20} color="#4B5563" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Video size={20} color="#4B5563" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <MoreVertical size={20} color="#4B5563" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Chat Area */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessageItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.chatContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 12 }]}>
                    <TouchableOpacity style={styles.attachButton}>
                        <Paperclip size={20} color="#6B7280" />
                    </TouchableOpacity>

                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor="#9CA3AF"
                        value={message}
                        onChangeText={setMessage}
                        multiline
                    />

                    <TouchableOpacity
                        style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
                        onPress={sendMessage}
                        disabled={!message.trim()}
                    >
                        <Send size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        gap: 12
    },
    backButton: { padding: 4 },
    headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatarHeader: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: '#E0E7FF',
        alignItems: 'center', justifyContent: 'center'
    },
    avatarTextHeader: { fontSize: 14, fontWeight: '700', color: '#4F46E5' },
    headerTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
    headerStatus: { fontSize: 12, color: '#2FA561', fontWeight: '500' },
    headerActions: { flexDirection: 'row', gap: 16 },
    iconButton: { padding: 4 },

    chatContent: { padding: 16, paddingBottom: 24, gap: 16 },

    // Messages
    messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '80%' },
    messageRowLeft: { alignSelf: 'flex-start' },
    messageRowRight: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },

    avatarSmall: {
        width: 28, height: 28, borderRadius: 14, backgroundColor: '#E0E7FF',
        alignItems: 'center', justifyContent: 'center', marginBottom: 2
    },
    avatarTextSmall: { fontSize: 10, fontWeight: '700', color: '#4F46E5' },

    messageBubble: {
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxWidth: '100%'
    },
    bubbleLeft: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 4
    },
    bubbleRight: {
        backgroundColor: '#2FA561',
        borderBottomRightRadius: 4
    },
    messageText: { fontSize: 15, lineHeight: 22 },
    textLeft: { color: '#1F2937' },
    textRight: { color: '#fff' },

    timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
    timeLeft: { color: '#9CA3AF' },
    timeRight: { color: 'rgba(255,255,255,0.7)' },

    // Input
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingTop: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 10
    },
    attachButton: { padding: 10, marginBottom: 4 },
    input: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        paddingTop: 10, // For multiline vertical centering
        fontSize: 15,
        color: '#1F2937',
        maxHeight: 100
    },
    sendButton: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#2FA561',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 4
    },
    sendButtonDisabled: { backgroundColor: '#D1D5DB' }
});
