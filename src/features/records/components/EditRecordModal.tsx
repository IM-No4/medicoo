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
import { DOCUMENT_TYPES, DocumentTypeValue, getDocumentTypeMeta } from '../documentTypes';

interface Props {
    visible: boolean;
    onClose: () => void;
    onSubmit: (details: { title: string; type: string; subtitle: string }) => Promise<void> | void;
    initialData: {
        uri: string;
        name?: string;
    } | null;
    // Pre-selects the category when opened from a category's own drill-down
    // screen, so the user doesn't have to re-pick the type they already
    // navigated into.
    initialType?: DocumentTypeValue;
    // When true, the document is being added from a specific folder's
    // context (a category screen's own FAB, or a folder card's "Add
    // Document" action) - the type picker is replaced with a static badge
    // so the record is guaranteed to land in that folder, not just default
    // to it while still being changeable.
    lockType?: boolean;
}

export default function EditRecordModal({ visible, onClose, onSubmit, initialData, initialType, lockType }: Props) {
    const insets = useSafeAreaInsets();
    const [title, setTitle] = useState('');
    const [type, setType] = useState<DocumentTypeValue>('prescription');
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
            // Only the extension is taken from the raw filename (needed to
            // keep the stored document name correctly suffixed) - the
            // visible field is left blank so the record's title is always a
            // name the user actually typed, never a raw upload filename
            // like "Screenshot_20260803-172133_...".
            const rawName = initialData.name || '';
            const lastDotIndex = rawName.lastIndexOf('.');

            if (lastDotIndex > 0) {
                setExtension(rawName.substring(lastDotIndex));
            } else {
                setExtension('');
            }
            setTitle('');

            setType(initialType || 'prescription');
            setSource('');
            setIsSubmitting(false);
        }
    }, [visible, initialData, initialType]);

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
            // error.message is just axios's generic "Request failed with
            // status code 400" - the server's actual reason (e.g. an
            // unsupported file type) lives in the response body instead.
            const serverMessage = error?.response?.data?.error || error?.response?.data?.message;
            showStatus('error', 'Upload Failed', serverMessage || 'We couldn\'t save your record. Please check your connection and try again.');
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
                        {lockType ? (
                            <View style={styles.lockedTypeBadge}>
                                <Text style={styles.lockedTypeText}>{getDocumentTypeMeta(type).label}</Text>
                            </View>
                        ) : (
                            <View style={styles.typeContainer}>
                                {DOCUMENT_TYPES.map((t) => (
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
                        )}
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
                            <ActivityIndicator size="large" color="#0FBBA1" />
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
    lockedTypeBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#EAFBF3',
        borderWidth: 1,
        borderColor: '#D1FAE5',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    lockedTypeText: {
        fontSize: 14,
        color: '#059669',
        fontWeight: '700',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        backgroundColor: '#FFFFFF',
    },
    submitButton: {
        backgroundColor: '#0FBBA1',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: "#0FBBA1",
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
