import React, { useEffect } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type StatusType = 'idle' | 'loading' | 'success' | 'date_error' | 'error' | 'warning' | 'info';

interface StatusModalProps {
    visible: boolean;
    status: StatusType;
    title?: string;
    message?: string;
    onClose: () => void;
    autoCloseDelay?: number; // Optional: Auto close success messages
    primaryAction?: () => void;
    primaryActionText?: string;
}

const DEFAULT_TITLES: Partial<Record<StatusType, string>> = {
    success: 'Success',
    error: 'Error',
    date_error: 'Error',
    warning: 'Warning',
    info: 'Information',
};

const PRIMARY_COLORS: Partial<Record<StatusType, string>> = {
    success: '#0FBBA1',
    error: '#EF4444',
    date_error: '#EF4444',
    info: '#3B82F6',
};

// Confirm dialogs (primaryAction set) read as "are you sure" prompts, so the
// action button is red regardless of type - matches how a plain single-
// button dismissal (no primaryAction) stays a neutral dark button instead.
const CONFIRM_COLOR = '#EF4444';

export default function StatusModal({
    visible,
    status,
    title,
    message,
    onClose,
    autoCloseDelay,
    primaryAction,
    primaryActionText
}: StatusModalProps) {

    // Auto-close logic for success state if requested
    useEffect(() => {
        if (status === 'success' && autoCloseDelay && visible) {
            const timer = setTimeout(() => {
                onClose();
            }, autoCloseDelay);
            return () => clearTimeout(timer);
        }
    }, [status, visible, autoCloseDelay, onClose]);

    if (!visible) return null;

    if (status === 'loading') {
        return (
            <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
                <View style={styles.overlay}>
                    <View style={[styles.card, styles.loadingCard]}>
                        <ActivityIndicator size="large" color="#0FBBA1" />
                        <Text style={styles.loadingText}>{message || 'Processing...'}</Text>
                    </View>
                </View>
            </Modal>
        );
    }

    if (status === 'idle') return null;

    // success/error/date_error are plain acknowledgements - one button,
    // always calling primaryAction if the caller gave one (so a custom
    // completion callback actually runs) or onClose otherwise. There's
    // nothing to "Cancel" out of, so no second button here.
    // warning/info double as confirm dialogs - a primaryAction turns them
    // into the two-button "Cancel" / "Yes" pattern; without one they're
    // just a single-button dismissal too.
    const isConfirmable = status === 'warning' || status === 'info';
    const showCancel = isConfirmable && !!primaryAction;
    const primaryColor = showCancel ? CONFIRM_COLOR : (PRIMARY_COLORS[status] || '#111827');
    const primaryLabel = primaryActionText || (showCancel ? 'Yes' : 'OK');

    return (
        <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Text style={styles.title}>{title || DEFAULT_TITLES[status]}</Text>
                    {!!message && <Text style={styles.message}>{message}</Text>}

                    <View style={styles.buttonRow}>
                        {showCancel && (
                            <TouchableOpacity style={[styles.button, styles.flexButton, styles.secondaryButton]} onPress={onClose}>
                                <Text style={styles.secondaryButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.button, styles.flexButton, { backgroundColor: primaryColor }]}
                            onPress={primaryAction || onClose}
                        >
                            <Text style={styles.buttonText}>{primaryLabel}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    loadingCard: {
        alignItems: 'center',
        maxWidth: 280,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 15,
        color: '#374151',
        fontWeight: '500',
        textAlign: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    message: {
        marginTop: 8,
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        marginTop: 22,
        gap: 12,
    },
    button: {
        paddingVertical: 13,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    flexButton: {
        flex: 1,
    },
    buttonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    secondaryButton: {
        backgroundColor: '#F3F4F6',
    },
    secondaryButtonText: {
        color: '#374151',
        fontSize: 15,
        fontWeight: '700',
    },
});
