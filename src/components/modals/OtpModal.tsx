import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface OtpModalProps {
    visible: boolean;
    email: string;
    onClose: () => void;
    onVerify: (otp: string) => Promise<void>;
    loading?: boolean;
}

export default function OtpModal({
    visible,
    email,
    onClose,
    onVerify,
    loading = false,
}: OtpModalProps) {
    const insets = useSafeAreaInsets();
    const [otp, setOtp] = useState('');

    const handleVerify = () => {
        if (otp.length === 6) {
            onVerify(otp);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Verification Code</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.subtitle}>
                            Please enter the 6-digit code sent to
                        </Text>
                        <Text style={styles.emailText}>{email}</Text>

                        <TextInput
                            style={styles.input}
                            value={otp}
                            onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ''))}
                            placeholder="000000"
                            keyboardType="number-pad"
                            maxLength={6}
                            textAlign="center"
                            autoFocus
                        />

                        <TouchableOpacity
                            style={[styles.verifyButton, otp.length !== 6 && styles.verifyButtonDisabled]}
                            onPress={handleVerify}
                            disabled={otp.length !== 6 || loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.verifyButtonText}>Verify Email</Text>
                            )}
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
        padding: 24,
    },
    container: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    closeButton: {
        padding: 4,
    },
    content: {
        alignItems: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    emailText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 24,
    },
    input: {
        width: '100%',
        height: 56,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        fontSize: 24,
        fontWeight: '600',
        color: '#111827',
        letterSpacing: 8,
        backgroundColor: '#F9FAFB',
        marginBottom: 24,
    },
    verifyButton: {
        width: '100%',
        backgroundColor: '#2FA561',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    verifyButtonDisabled: {
        backgroundColor: '#93E5DB',
    },
    verifyButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
