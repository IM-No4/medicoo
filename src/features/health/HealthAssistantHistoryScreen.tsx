import AppIcon from '@/src/components/icons/AppIcon';
import {
    getHealthAssistantSessions,
    HealthAssistantSession,
} from '@/src/services/api/healthAssistant.api';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function HealthAssistantHistoryScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    const [sessions, setSessions] = useState<HealthAssistantSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getHealthAssistantSessions()
            .then(setSessions)
            .catch((e) => console.warn('Failed to fetch health assistant sessions', e))
            .finally(() => setLoading(false));
    }, []);

    // Navigating back to an already-in-stack screen with new params pops
    // to it (sliding back out to the right) and merges the params in one
    // step - AIAssistantChatScreen picks up resumeSessionId to load it.
    const handleSelect = (session: HealthAssistantSession) => {
        navigation.navigate('AIAssistantChat', { resumeSessionId: session.sessionId });
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Past conversations</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                style={styles.flexOne}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <ActivityIndicator size="large" color="#0FBBA1" style={{ marginTop: 40 }} />
                ) : sessions.length === 0 ? (
                    <Text style={styles.emptyText}>No past conversations with Medo yet.</Text>
                ) : (
                    sessions.map((session) => (
                        <TouchableOpacity
                            key={session.sessionId}
                            style={styles.card}
                            onPress={() => handleSelect(session)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.iconContainer}>
                                <AppIcon name="clock" size={20} color="#0FBBA1" />
                            </View>
                            <View style={styles.cardContent}>
                                <Text style={styles.cardTitle} numberOfLines={1}>
                                    {session.firstMessage}
                                </Text>
                                <Text style={styles.cardSubtitle}>
                                    {formatDate(session.lastActivity)} · {session.messageCount} message{session.messageCount !== 1 ? 's' : ''}
                                </Text>
                            </View>
                            <AppIcon name="chevron-right" size={18} color="#C7C7CC" />
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    flexOne: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        gap: 12,
    },
    backButton: { padding: 4 },
    headerTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#111827' },
    headerSpacer: { width: 24 },
    scrollContent: { padding: 20, flexGrow: 1 },
    emptyText: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 20,
        textAlign: 'center',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        backgroundColor: '#F9FAFB',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    cardContent: {
        flex: 1,
        marginRight: 8,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
});
