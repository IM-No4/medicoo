import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, HeartHandshake, Info, ShieldAlert, Stethoscope } from 'lucide-react-native';
import React from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MEDICAL_DISCLAIMER_TITLE } from '../../constants/medicalDisclaimer';

// Deliberately not the bare LegalPage component Terms/Privacy use - that's
// just a header + one block of justified text, which reads fine for those
// two (several headed sections break up the read) but looked like a bare
// wall of text for this one, single-paragraph disclaimer. Every card below
// is still the exact verbatim wording from constants/medicalDisclaimer.ts's
// MEDICAL_DISCLAIMER_FULL - just split at its own sentence boundaries and
// given a heading/icon each, not paraphrased.
const POINTS: { icon: any; iconBg: string; iconColor: string; heading: string; body: string }[] = [
    {
        icon: ShieldAlert,
        iconBg: '#FEF2F2',
        iconColor: '#EF4444',
        heading: 'Not a Medical Device',
        body: 'Medicoo is not a medical device and is not intended to diagnose, treat, cure, or prevent any disease or medical condition.',
    },
    {
        icon: Stethoscope,
        iconBg: '#EFF6FF',
        iconColor: '#3B82F6',
        heading: 'No Medical Advice',
        body: 'Medicoo does not provide medical advice.',
    },
    {
        icon: Info,
        iconBg: '#FFFBEB',
        iconColor: '#F59E0B',
        heading: 'Informational Purposes Only',
        body: 'The health tracking, medication reminders, and family health record features are for informational and organizational purposes only.',
    },
    {
        icon: HeartHandshake,
        iconBg: '#F0FDF4',
        iconColor: '#0FBBA1',
        heading: 'Always Consult a Professional',
        body: 'Always consult a qualified healthcare professional for medical advice, diagnosis, or treatment, and before making any decisions related to your health or medications.',
    },
];

export default function MedicalDisclaimerScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header - same recipe as the rest of the app's screens */}
            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{MEDICAL_DISCLAIMER_TITLE}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {POINTS.map((point) => {
                    const Icon = point.icon;
                    return (
                        <View key={point.heading} style={styles.card}>
                            <View style={[styles.iconCircle, { backgroundColor: point.iconBg }]}>
                                <Icon size={20} color={point.iconColor} />
                            </View>
                            <View style={styles.cardText}>
                                <Text style={styles.cardHeading}>{point.heading}</Text>
                                <Text style={styles.cardBody}>{point.body}</Text>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>

            {/* Fixed (non-scrolling) safe-area footer - see LegalPage.tsx's
                matching footer comment: guarantees this strip is always
                solid white and never has a card scrolled into it. */}
            <View style={{ height: Math.max(insets.bottom, 16), backgroundColor: '#FFFFFF' }} />
        </View>
    );
}

const styles = StyleSheet.create({
    // Absolute + StyleSheet.absoluteFillObject instead of flex: 1 - see
    // LegalPage.tsx's container comment for the full reasoning (nav bar
    // forced fully transparent app-wide, and a flex: 1 root on this nested
    // route was coming up short of the true screen bottom).
    container: { ...StyleSheet.absoluteFillObject, backgroundColor: '#FFFFFF' },
    header: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 16,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
            android: { elevation: 2 },
        }),
    },
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
    scroll: { flex: 1 },
    content: { padding: 20 },
    card: {
        flexDirection: 'row',
        gap: 14,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardText: { flex: 1 },
    cardHeading: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
    cardBody: { fontSize: 14, lineHeight: 21, color: '#4B5563' },
});
