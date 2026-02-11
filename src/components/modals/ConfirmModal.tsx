import { AlertTriangle } from 'lucide-react-native';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ConfirmModalProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmColor?: string;
}

export default function ConfirmModal({
    visible,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    confirmColor = '#EF4444', // Default to red for destructive actions
}: ConfirmModalProps) {
    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.iconCircle}>
                        <AlertTriangle size={32} color={confirmColor} />
                    </View>

                    <Text style={styles.titleText}>{title}</Text>
                    <Text style={styles.messageText}>{message}</Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onCancel}
                        >
                            <Text style={styles.cancelButtonText}>{cancelText}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.confirmButton, { backgroundColor: confirmColor }]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.confirmButtonText}>{confirmText}</Text>
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
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FEF2F2',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    titleText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
    },
    messageText: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#4B5563',
        fontSize: 15,
        fontWeight: '600',
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});
