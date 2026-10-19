import AppIcon from '@/src/components/icons/AppIcon';
import {
    getHealthAssistantSessions,
    HealthAssistantSession,
} from '@/src/services/api/healthAssistant.api';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, MessageCircle } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** "Today", "Yesterday", "This week", or the month, so a long list reads in chunks. */
const groupOf = (dateString: string) => {
    const date = new Date(dateString);
    const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);
    if (days <= 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return 'This week';
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

const timeLabel = (dateString: string) => {
    const date = new Date(dateString);
    const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);
    if (days <= 0) return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export default function HealthAssistantHistoryScreen() {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    const [sessions, setSessions] = useState<HealthAssistantSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [failed, setFailed] = useState(false);

    const load = useCallback(async () => {
        try {
            setFailed(false);
            const data = await getHealthAssistantSessions();
            setSessions(data || []);
        } catch (e) {
            console.warn('Failed to fetch health assistant sessions', e);
            setFailed(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // Navigating back to an already-in-stack screen with new params pops
    // to it (sliding back out to the right) and merges the params in one
    // step - AIAssistantChatScreen picks up resumeSessionId to load it.
    const handleSelect = (session: HealthAssistantSession) => {
        navigation.navigate('AIAssistantChat', { resumeSessionId: session.sessionId });
    };

    const groups = useMemo(() => {
        const sorted = [...sessions].sort(
            (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime(),
        );
        const out: { title: string; items: HealthAssistantSession[] }[] = [];
        sorted.forEach((s) => {
            const title = groupOf(s.lastActivity);
            const last = out[out.length - 1];
            if (last && last.title === title) last.items.push(s);
            else out.push({ title, items: [s] });
        });
        return out;
    }, [sessions]);

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('past_conversations')}</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                style={styles.flexOne}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 + insets.bottom }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            load();
                        }}
                        tintColor="#10B981"
                        colors={['#10B981']}
                    />
                }
            >
                {loading ? (
                    <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 40 }} />
                ) : failed ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyTitle}>Could not load your conversations</Text>
                        <Text style={styles.emptyText}>Check your connection and try again.</Text>
                        <TouchableOpacity
                            style={styles.primaryBtn}
                            onPress={() => {
                                setLoading(true);
                                load();
                            }}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.primaryBtnText}>Try again</Text>
                        </TouchableOpacity>
                    </View>
                ) : sessions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconCircle}>
                            <MessageCircle size={28} color={theme.textMuted} />
                        </View>
                        <Text style={styles.emptyTitle}>No conversations yet</Text>
                        <Text style={styles.emptyText}>{t('no_past_conversations_with_medo_yet')}</Text>
                        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
                            <Text style={styles.primaryBtnText}>Start a chat</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    groups.map((group) => (
                        <View key={group.title}>
                            <Text style={styles.groupTitle}>{group.title}</Text>
                            {group.items.map((session) => (
                                <TouchableOpacity
                                    key={session.sessionId}
                                    style={styles.card}
                                    onPress={() => handleSelect(session)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.iconContainer}>
                                        <AppIcon name="clock" size={18} color="#10B981" />
                                    </View>
                                    <View style={styles.cardContent}>
                                        <Text style={styles.cardTitle} numberOfLines={2}>
                                            {session.firstMessage}
                                        </Text>
                                        <Text style={styles.cardSubtitle}>
                                            {timeLabel(session.lastActivity)} · {session.messageCount} message{session.messageCount !== 1 ? 's' : ''}
                                        </Text>
                                    </View>
                                    <AppIcon name="chevron-right" size={16} color={theme.textMuted} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    flexOne: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 16,
        backgroundColor: c.card,
        gap: 12,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
            android: { elevation: 2 },
        }),
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -8,
    },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: c.text },
    headerSpacer: { width: 40 },
    scrollContent: { padding: 16, paddingBottom: 32, flexGrow: 1 },
    groupTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: c.textSecondary,
        marginTop: 8,
        marginBottom: 8,
        marginLeft: 4,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        backgroundColor: c.card,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: c.borderLight,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: c.successBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    cardContent: {
        flex: 1,
        marginRight: 8,
    },
    cardTitle: {
        fontSize: 13.5,
        fontWeight: '700',
        color: c.text,
        marginBottom: 3,
        lineHeight: 18,
    },
    cardSubtitle: {
        fontSize: 11.5,
        color: c.textSecondary,
    },
    emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
    emptyIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: c.cardSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: c.text, marginBottom: 6, textAlign: 'center' },
    emptyText: { fontSize: 13, color: c.textSecondary, textAlign: 'center', lineHeight: 19 },
    primaryBtn: {
        marginTop: 20,
        height: 48,
        borderRadius: 10,
        paddingHorizontal: 28,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBtnText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.6, color: '#fff' },
});
