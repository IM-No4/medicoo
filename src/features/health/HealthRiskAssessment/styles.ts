import { StyleSheet } from 'react-native';

export const ACCENT = '#0FBBA1';

export const BUCKET_COLOR: Record<string, string> = {
    'Needs attention': '#F59E0B',
    Fair: '#3B82F6',
    Good: '#10B981',
};

export const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    heading: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 6,
    },
    subheading: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 24,
        fontWeight: '500',
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
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
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    optionRowActive: {
        borderColor: ACCENT,
        backgroundColor: ACCENT + '0D',
    },
    optionLabel: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#0F172A',
    },
    optionLabelActive: {
        color: ACCENT,
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#CBD5E1',
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
        backgroundColor: '#FFFFFF',
    },
    hint: {
        fontSize: 13,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: '500',
        marginTop: 20,
    },
});
