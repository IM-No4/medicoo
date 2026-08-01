import { X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StatusModal, { StatusType } from '../../../components/modals/StatusModal';

interface Props {
    visible: boolean;
    onClose: () => void;
    onSubmit: (details: { title: string; type: string; subtitle: string }) => Promise<void> | void;
    initialData: {
        uri: string;
        name?: string;
    } | null;
}

const RECORD_TYPES = [
    { label: 'Lab Report', value: 'lab_report' },
    { label: 'Scan', value: 'scan' },
    { label: 'Prescription', value: 'prescription' },
    { label: 'Other', value: 'other' },
];

export default function EditRecordModal({ visible, onClose, onSubmit, initialData }: Props) {
    const insets = useSafeAreaInsets();
    const [title, setTitle] = useState('');
    const [type, setType] = useState('prescription');
    const [source, setSource] = useState('');
    const [extension, setExtension] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Status Modal State
    const [status, setStatus] = useState<{
        visible: boolean;
        type: StatusType;
        title: string;
        message: string;
    }>({
        visible: false,
        type: 'idle',
        title: '',
        message: ''
    });

    const showStatus = (type: StatusType, title: string, message: string) => {
        setStatus({ visible: true, type, title, message });
    };

    const hideStatus = () => setStatus(prev => ({ ...prev, visible: false }));

    useEffect(() => {
        if (visible && initialData) {
            const rawName = initialData.name || 'New Document';
            const lastDotIndex = rawName.lastIndexOf('.');

            if (lastDotIndex > 0) {
                setTitle(rawName.substring(0, lastDotIndex));
                setExtension(rawName.substring(lastDotIndex));
            } else {
                setTitle(rawName);
                setExtension('');
            }

            setType('prescription');
            setSource('');
            setIsSubmitting(false);
        }
    }, [visible, initialData]);

    const handleSubmit = async () => {
        if (!title.trim()) {
            showStatus('warning', 'Name Required', 'Please provide a name for this document to keep your records organized.');
            return;
        }

        setIsSubmitting(true);

        try {
            await onSubmit({
                title: title.trim() + extension,
                type,
                subtitle: source.trim() || 'User Uploaded',
            });
        } catch (error: any) {
            showStatus('error', 'Upload Failed', error.message || 'We couldn\'t save your record. Please check your connection and try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={[styles.header, { marginTop: insets.top }]}>
                    <Text style={styles.headerTitle}>Record Details</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton} disabled={isSubmitting}>
                        <X size={20} color="#1F2937" />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Document Name */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Document Name <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="e.g. Blood Test Report"
                            placeholderTextColor="#9CA3AF"
                            autoFocus
                            editable={!isSubmitting}
                        />
                    </View>

                    {/* Document Type */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Document Type <Text style={styles.required}>*</Text></Text>
                        <View style={styles.typeContainer}>
                            {RECORD_TYPES.map((t) => (
                                <TouchableOpacity
                                    key={t.value}
                                    style={[
                                        styles.typePill,
                                        type === t.value && styles.typePillActive
                                    ]}
                                    onPress={() => setType(t.value)}
                                    disabled={isSubmitting}
                                >
                                    <Text style={[
                                        styles.typeText,
                                        type === t.value && styles.typeTextActive
                                    ]}>
                                        {t.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Source */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Source (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={source}
                            onChangeText={setSource}
                            placeholder="Hospital / Lab / Doctor"
                            placeholderTextColor="#9CA3AF"
                            editable={!isSubmitting}
                        />
                    </View>
                </ScrollView>

                {/* Footer Button */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                >
                    <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
                        <TouchableOpacity
                            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.submitButtonText}>Save Record</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>

                {/* Overlay Loading (Optional: if we want full screen block) */}
                {isSubmitting && (
                    <View style={styles.overlay}>
                        <View style={styles.overlayContent}>
                            <ActivityIndicator size="large" color="#2FA561" />
                            <Text style={styles.overlayText}>Saving...</Text>
                        </View>
                    </View>
                )}

                {/* Status Modal */}
                <StatusModal
                    visible={status.visible}
                    status={status.type}
                    title={status.title}
                    message={status.message}
                    onClose={hideStatus}
                />
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    closeButton: {
        width: 40,
        height: 40,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        gap: 24,
    },
    field: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    required: {
        color: '#EF4444',
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#111827',
    },
    typeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    typePill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    typePillActive: {
        backgroundColor: '#111827',
        borderColor: '#111827',
    },
    typeText: {
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '500',
    },
    typeTextActive: {
        color: '#FFFFFF',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        backgroundColor: '#FFFFFF',
    },
    submitButton: {
        backgroundColor: '#2FA561',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: "#2FA561",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        backgroundColor: '#9CA3AF',
        shadowOpacity: 0,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    overlayContent: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    overlayText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    }
});
