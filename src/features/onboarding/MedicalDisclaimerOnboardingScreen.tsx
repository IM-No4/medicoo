import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { ShieldAlert } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    MEDICAL_DISCLAIMER_ACK_KEY,
    MEDICAL_DISCLAIMER_FULL,
    MEDICAL_DISCLAIMER_TITLE,
} from '../../constants/medicalDisclaimer';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';

// Required first step of onboarding - added after Google Play rejected the
// app under the Health Content and Services policy for not surfacing this
// disclaimer in-app (only the Play Store listing had it). Blocks
// HealthProfileScreen (and everything past it) until acknowledged; see
// OnboardingStack.tsx for how this is wired as the first screen.
//
// Persisting the ack flag isn't what gates this screen (it always shows
// once per onboarding-stack mount, deliberately - see OnboardingStack.tsx's
// comment for why), it's just a record that acknowledgment happened, kept
// in case a future screen/support flow needs to check it.
export default function MedicalDisclaimerOnboardingScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    const handleAcknowledge = async () => {
        try {
            await AsyncStorage.setItem(MEDICAL_DISCLAIMER_ACK_KEY, new Date().toISOString());
        } catch {
            // Non-fatal - this is just a record of acknowledgment, not the gate
            // itself, so a storage failure shouldn't block onboarding.
        }
        navigation.navigate('HealthProfile');
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 24 : 16) }]}>
                <View style={styles.iconCircle}>
                    <ShieldAlert size={32} color="#FFFFFF" />
                </View>
                <Text style={styles.title}>{MEDICAL_DISCLAIMER_TITLE}</Text>
                <Text style={styles.subtitle}>{t('please_read_before_continuing')}</Text>
            </View>

            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.disclaimerText}>{MEDICAL_DISCLAIMER_FULL}</Text>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={handleAcknowledge}>
                    <Text style={styles.buttonText}>{t('i_understand')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
        backgroundColor: '#10B981',
        alignItems: 'center',
        paddingBottom: 28,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
    subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
    body: { flex: 1 },
    bodyContent: { padding: 24 },
    disclaimerText: { fontSize: 15, lineHeight: 24, color: c.text },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 12,
        backgroundColor: c.card,
        borderTopWidth: 1,
        borderTopColor: c.borderLight,
    },
    button: {
        backgroundColor: '#10B981',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
    },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
