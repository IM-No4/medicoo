import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from '../../components/ThemedStatusBar';
import { ChevronLeft, Heart } from 'lucide-react-native';
import React, { useEffect, useState, useMemo } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getLocalDateString } from '../../utils/dateUtils';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';

const STORAGE_KEY_PREFIX = 'GRATITUDE_JOURNAL_';
const PROMPTS = [
    'Something that made you smile today...',
    'Someone you’re thankful for...',
    'A small win, big or small...',
];

// A quick reflective activity (typing, not a timer) - same self-contained,
// zero-network pattern as the other wellness activities, just a different
// kind of interaction. Entries are kept purely on-device (AsyncStorage) -
// there's no backend model for this, and a private daily journal doesn't
// need one to be useful. Amber/gold for warmth and appreciation, distinct
// from the other activities' cyan/emerald/violet/blue.
export default function GratitudeJournalScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const todayStr = getLocalDateString();
    const storageKey = `${STORAGE_KEY_PREFIX}${todayStr}`;

    const [entries, setEntries] = useState(['', '', '']);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        AsyncStorage.getItem(storageKey)
            .then((raw) => {
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.length === 3) {
                        setEntries(parsed);
                        setSaved(true);
                    }
                }
            })
            .catch((e) => console.warn('Failed to load gratitude journal entry', e))
            .finally(() => setLoading(false));
    }, [storageKey]);

    const handleChange = (index: number, value: string) => {
        setSaved(false);
        setEntries((prev) => prev.map((entry, i) => (i === index ? value : entry)));
    };

    const canSave = entries.some((e) => e.trim().length > 0);

    const handleSave = async () => {
        try {
            await AsyncStorage.setItem(storageKey, JSON.stringify(entries));
            setSaved(true);
        } catch (e) {
            console.warn('Failed to save gratitude journal entry', e);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar style="dark" />

            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('gratitude_journal')}</Text>
                <View style={{ width: 40 }} />
            </View>

            {!loading && (
                <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]} showsVerticalScrollIndicator={false}>
                    <View style={styles.introIcon}>
                        <Heart size={22} color="#D97706" />
                    </View>
                    <Text style={styles.intro}>{t('what_are_three_things_you_re_grateful')}</Text>

                    {entries.map((entry, index) => (
                        <View key={index} style={styles.inputRow}>
                            <View style={styles.numberBadge}>
                                <Text style={styles.numberBadgeText}>{index + 1}</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder={PROMPTS[index]}
                                placeholderTextColor={theme.warning}
                                value={entry}
                                onChangeText={(value) => handleChange(index, value)}
                                multiline
                            />
                        </View>
                    ))}

                    <TouchableOpacity
                        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
                        activeOpacity={0.85}
                        onPress={handleSave}
                        disabled={!canSave}
                    >
                        <Text style={styles.saveButtonText}>{saved ? 'Saved for Today' : 'Save'}</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}
        </KeyboardAvoidingView>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: c.card },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 16,
        backgroundColor: c.card,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
            android: { elevation: 2 },
        }),
    },
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: c.text },
    content: { padding: 24, paddingBottom: 40, alignItems: 'center' },
    introIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: c.warningBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    intro: {
        fontSize: 15,
        fontWeight: '700',
        color: c.text,
        textAlign: 'center',
        marginBottom: 24,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        width: '100%',
        gap: 12,
        marginBottom: 14,
    },
    numberBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: c.warningBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    numberBadgeText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#D97706',
    },
    input: {
        flex: 1,
        backgroundColor: c.warningBg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FDE68A',
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: '#78350F',
        minHeight: 48,
    },
    saveButton: {
        marginTop: 12,
        backgroundColor: '#D97706',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 40,
    },
    saveButtonDisabled: {
        backgroundColor: c.cardSecondary,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
});
