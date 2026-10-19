import { Stethoscope, Truck } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { executeAction } from '../../../../actions/ActionExecutor';
import { NotServiceableBannerFeedItem } from '../feed.types';
import { useTheme } from '../../../../theme/ThemeContext';
import type { ThemeColors } from '../../../../theme/colors';
import { useLanguage } from '../../../../i18n/LanguageContext';

type Props = {
    data: NotServiceableBannerFeedItem;
};

// Shown instead of the pharmacy category row/product carousels when
// homeController.js finds no store within delivery range - same
// "we're not in your area yet, but here's what you can still do" pattern
// Swiggy/Zomato use for unserviceable addresses, rather than just an empty
// screen. The "Book a Consultation" shortcut is the concrete fallback the
// backend re-enables the SERVICES_SECTION/DOCTOR_RECOMMENDATION sections
// for in this same response - this card just gives it top billing instead
// of making the user scroll to find it.
function NotServiceableCard({ data }: Props) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    return (
        <View style={styles.container}>
            <View style={styles.iconCircle}>
                <Truck size={28} color="#10B981" />
            </View>

            <Text style={styles.title}>{data.title}</Text>
            <Text style={styles.subtitle}>{data.subtitle}</Text>

            <TouchableOpacity
                style={styles.cta}
                activeOpacity={0.85}
                onPress={() => executeAction('OPEN_DOCTOR_LIST')}
            >
                <Stethoscope size={16} color="#FFFFFF" />
                <Text style={styles.ctaText}>{t('book_consultation_instead')}</Text>
            </TouchableOpacity>
        </View>
    );
}

export default React.memo(NotServiceableCard);

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: {
        marginHorizontal: 20,
        // Matches every other feed card's marginBottom:28 - this was 20,
        // making the gap after this card noticeably tighter than the rest
        // of the feed's otherwise-uniform rhythm.
        marginBottom: 30,
        backgroundColor: c.card,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        // Same "subtle premium border" convention as the feed's other
        // single, centered promo cards (BloodDonationAwarenessCard.tsx,
        // HealthSummary.tsx's hero) - a light border reads cleaner than
        // this card's old shadow-only look, and its shadow is toned down
        // to match rather than stack on top of it.
        borderWidth: 1,
        borderColor: c.borderLight,
        ...Platform.select({
            ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4 },
            android: { elevation: 0 },
        }),
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: c.successBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: c.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 13,
        lineHeight: 20,
        color: c.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
    },
    cta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#10B981',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    ctaText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
});
