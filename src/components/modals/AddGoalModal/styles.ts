import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    /* ---------- Layout ---------- */
    stepContainer: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },

    iconHeader: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },

    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },

    /* ---------- Text ---------- */
    stepTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },

    /* ---------- Option Cards ---------- */
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },

    optionCardSelected: {
        backgroundColor: '#ECFDF5',
        borderColor: '#2FA561',
    },

    optionText: {
        fontSize: 16,
        color: '#1F2937',
        flex: 1,
    },

    optionTextSelected: {
        color: '#065F46',
        fontWeight: '600',
    },

    /* ---------- Inputs ---------- */
    inputGroup: {
        marginBottom: 16,
    },

    inputLabel: {
        fontSize: 13,
        color: '#4B5563',
        marginBottom: 6,
    },

    input: {
        backgroundColor: '#F9FAFB',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        fontSize: 17,
        color: '#111827',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },

    /* ---------- Modal Structure ---------- */
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    backdropTouchable: {
        flex: 1,
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '85%',
        overflow: 'hidden',
    },
    modalHeader: {
        paddingTop: 16,
        paddingBottom: 24,
        paddingHorizontal: 20,
        zIndex: 10,
    },
    dragIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 16,
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: {
        width: 40,
        alignItems: 'flex-start',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerRight: {
        width: 40,
        alignItems: 'flex-end',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#111827',
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconButtonPlaceholder: {
        width: 36,
        height: 36,
    },
    content: {
        flex: 1,
    },

    /* ---------- Footer ---------- */
    fixedFooter: {
        paddingHorizontal: 20,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
    },
    primaryButton: {
        backgroundColor: '#2FA561',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
    },
    primaryButtonDisabled: {
        backgroundColor: '#E5E7EB',
    },
    primaryText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
});
