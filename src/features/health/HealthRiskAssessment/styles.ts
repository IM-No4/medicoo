import { StyleSheet } from 'react-native';

import type { ThemeColors } from '../../../theme/colors';

export const ACCENT = '#10B981';

export const BUCKET_COLOR: Record<string, string> = {
    'Needs attention': '#F59E0B',
    Fair: '#3B82F6',
    Good: '#10B981',
};

export const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    heading: {
        fontSize: 16,
        fontWeight: '700',
        color: c.text,
        marginBottom: 6,
    },
    subheading: {
        fontSize: 13,
        lineHeight: 19,
        color: c.textSecondary,
        marginBottom: 24,
        fontWeight: '500',
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: c.textMuted,
        letterSpacing: 1.5,
        marginBottom: 12,
        marginTop: 20,
    },
    optionList: {
        gap: 8,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: c.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: c.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    optionRowActive: {
        borderColor: ACCENT,
        backgroundColor: ACCENT + '0D',
    },
    optionLabel: {
        flex: 1,
        fontSize: 13.5,
        fontWeight: '700',
        color: c.text,
    },
    optionLabelActive: {
        color: ACCENT,
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: c.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioActive: {
        borderColor: ACCENT,
        backgroundColor: ACCENT,
    },
    radioDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: c.card,
    },
    hint: {
        fontSize: 12,
        color: c.textMuted,
        textAlign: 'center',
        lineHeight: 17,
        fontWeight: '500',
        marginTop: 20,
    },
});
