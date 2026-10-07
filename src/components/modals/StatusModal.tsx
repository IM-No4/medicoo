import React, { useEffect } from 'react';
import { ActivityIndicator, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    secondaryActionText?: string;
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
    warning: '#0FBBA1',
    info: '#3B82F6',
};

// Every popup card gets a soft colored glow matching its status (falls back
// to the app's teal for warning/loading, which have no primary color of
// their own) instead of a plain neutral drop shadow. Android's `elevation`
// can't render a colored shadow at all (it's always grey/black no matter
// what shadowColor says) - genuinely emulating a coloured glow there needs
// a shadow library, which isn't installed and couldn't be added in this
// environment (no network access to npm). A translucent colored border
// ring is the zero-dependency stand-in for the glow on that platform, on
// top of the same elevation for depth.
const GLOW_COLORS: Record<StatusType, string> = {
    idle: '#0FBBA1',
    loading: '#0FBBA1',
    success: '#0FBBA1',
    error: '#EF4444',
    date_error: '#EF4444',
    warning: '#F59E0B',
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
    primaryActionText,
    secondaryActionText
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

    const glowColor = GLOW_COLORS[status];
    const glowStyle = Platform.select({
        ios: { shadowColor: glowColor, shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 0 } },
        android: { borderWidth: 1.5, borderColor: `${glowColor}55` },
        default: {},
    });

    if (status === 'loading') {
        return (
            <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
                <View style={styles.overlay}>
                    <View style={[styles.card, styles.loadingCard, glowStyle]}>
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
                <View style={[styles.card, glowStyle]}>
                    <Text style={styles.title}>{title || DEFAULT_TITLES[status]}</Text>
                    {!!message && <Text style={styles.message}>{message}</Text>}

                    <View style={styles.buttonRow}>
                        {showCancel && (
                            <TouchableOpacity style={[styles.button, styles.flexButton, styles.secondaryButton]} onPress={onClose}>
                                <Text style={styles.secondaryButtonText}>{secondaryActionText || 'Cancel'}</Text>
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
        // Base depth - the actual glow color/opacity/radius (iOS) or border
        // ring (Android) is layered on top per-status via `glowStyle` above.
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
        textAlign: 'center',
    },
    message: {
        marginTop: 8,
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        textAlign: 'center',
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
