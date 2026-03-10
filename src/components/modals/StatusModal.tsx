import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react-native';
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

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <View style={styles.centerContent}>
                        <ActivityIndicator size="large" color="#2FA561" />
                        <Text style={styles.loadingText}>{message || 'Processing...'}</Text>
                    </View>
                );

            case 'success':
                return (
                    <View style={styles.centerContent}>
                        <CheckCircle size={48} color="#10B981" />
                        <Text style={styles.titleText}>{title || 'Success'}</Text>
                        <Text style={styles.messageText}>{message || 'Action completed successfully.'}</Text>
                        <TouchableOpacity style={styles.button} onPress={primaryAction || onClose}>
                            <Text style={styles.buttonText}>{primaryActionText || 'Close'}</Text>
                        </TouchableOpacity>
                    </View>
                );

            case 'error':
            case 'date_error':
                return (
                    <View style={styles.centerContent}>
                        <XCircle size={48} color="#EF4444" />
                        <Text style={[styles.titleText, { color: '#EF4444' }]}>{title || 'Error'}</Text>
                        <Text style={styles.messageText}>{message || 'Something went wrong.'}</Text>
                        <TouchableOpacity style={[styles.button, styles.errorButton]} onPress={onClose}>
                            <Text style={styles.buttonText}>{primaryActionText || 'Close'}</Text>
                        </TouchableOpacity>
                    </View>
                );

            case 'warning':
                return (
                    <View style={styles.centerContent}>
                        <AlertCircle size={48} color="#F59E0B" />
                        <Text style={[styles.titleText, { color: '#F59E0B' }]}>{title || 'Warning'}</Text>
                        <Text style={styles.messageText}>{message || 'Please check your input.'}</Text>
                        <View style={styles.buttonRow}>
                            {primaryAction && (
                                <TouchableOpacity style={[styles.button, styles.flexButton, styles.warningButton]} onPress={primaryAction}>
                                    <Text style={styles.buttonText}>{primaryActionText || 'Confirm'}</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={[styles.button, styles.flexButton, styles.outlineButton, !primaryAction && styles.warningButton]} onPress={onClose}>
                                <Text style={[styles.buttonText, primaryAction && styles.outlineButtonText]}>{primaryAction ? 'Cancel' : 'Close'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );

            case 'info':
                return (
                    <View style={styles.centerContent}>
                        <Info size={48} color="#3B82F6" />
                        <Text style={[styles.titleText, { color: '#3B82F6' }]}>{title || 'Information'}</Text>
                        <Text style={styles.messageText}>{message}</Text>
                        <View style={styles.buttonRow}>
                            {primaryAction && (
                                <TouchableOpacity style={[styles.button, styles.flexButton, styles.infoButton]} onPress={primaryAction}>
                                    <Text style={styles.buttonText}>{primaryActionText || 'Confirm'}</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={[styles.button, styles.flexButton, styles.outlineButton, !primaryAction && styles.infoButton]} onPress={onClose}>
                                <Text style={[styles.buttonText, primaryAction && styles.outlineButtonText]}>{primaryAction ? 'Cancel' : 'Close'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    {renderContent()}
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
        paddingVertical: 32,
        paddingHorizontal: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    centerContent: {
        alignItems: 'center',
        width: '100%',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
    },
    titleText: {
        marginTop: 16,
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
    },
    messageText: {
        marginTop: 8,
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    button: {
        backgroundColor: '#2FA561',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        minWidth: 120,
        alignItems: 'center',
    },
    flexButton: {
        flex: 1,
    },
    errorButton: {
        backgroundColor: '#EF4444',
    },
    warningButton: {
        backgroundColor: '#F59E0B'
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        marginTop: 8,
        width: '100%',
        justifyContent: 'center',
        gap: 12,
    },
    infoButton: {
        backgroundColor: '#3B82F6',
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    outlineButtonText: {
        color: '#374151',
    },
});
