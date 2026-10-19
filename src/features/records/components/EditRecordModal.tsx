import { X } from 'lucide-react-native';
import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StatusModal, { StatusType } from '../../../components/modals/StatusModal';
import { DOCUMENT_TYPES, DocumentTypeValue, getDocumentTypeMeta } from '../documentTypes';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';
import { useLanguage } from '../../../i18n/LanguageContext';
import { Modal } from '../../../components/ThemedModal';

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
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
            showStatus('warning', t('name_required'), t('please_provide_a_name_for_this_documen'));
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
            showStatus('error', t('upload_failed'), serverMessage || 'We couldn\'t save your record. Please check your connection and try again.');
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
                    <Text style={styles.headerTitle}>{t('record_details')}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton} disabled={isSubmitting}>
                        <X size={20} color={theme.text} />
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
                        <Text style={styles.label}>{t('Document Name')} <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="e.g. Blood Test Report"
                            placeholderTextColor={theme.textMuted}
                            autoFocus
                            editable={!isSubmitting}
                        />
                    </View>

                    {/* Document Type */}
                    <View style={styles.field}>
                        <Text style={styles.label}>{t('Document Type')} <Text style={styles.required}>*</Text></Text>
                        {lockType ? (
                            <View style={styles.lockedTypeBadge}>
                                <Text style={styles.lockedTypeText}>{t(getDocumentTypeMeta(type).label)}</Text>
                            </View>
                        ) : (
                            <View style={styles.typeContainer}>
                                {DOCUMENT_TYPES.map((docType) => (
                                    <TouchableOpacity
                                        key={docType.value}
                                        style={[
                                            styles.typePill,
                                            type === docType.value && styles.typePillActive
                                        ]}
                                        onPress={() => setType(docType.value)}
                                        disabled={isSubmitting}
                                    >
                                        <Text style={[
                                            styles.typeText,
                                            type === docType.value && styles.typeTextActive
                                        ]}>
                                            {t(docType.label)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Source */}
                    <View style={styles.field}>
                        <Text style={styles.label}>{t('source_optional')}</Text>
                        <TextInput
                            style={styles.input}
                            value={source}
                            onChangeText={setSource}
                            placeholder={t('hospital_lab_doctor')}
                            placeholderTextColor={theme.textMuted}
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
                                <Text style={styles.submitButtonText}>{t('save_record')}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>

                {/* Overlay Loading (Optional: if we want full screen block) */}
                {isSubmitting && (
                    <View style={styles.overlay}>
                        <View style={styles.overlayContent}>
                            <ActivityIndicator size="large" color="#10B981" />
                            <Text style={styles.overlayText}>{t('saving')}</Text>
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

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: c.card,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: c.borderLight,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: c.text,
    },
    closeButton: {
        width: 40,
        height: 40,
        backgroundColor: c.cardSecondary,
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
        color: c.text,
    },
    required: {
        color: '#EF4444',
    },
    input: {
        backgroundColor: c.cardSecondary,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: c.text,
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
        backgroundColor: c.cardSecondary,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    typePillActive: {
        backgroundColor: '#111827',
        borderColor: '#111827',
    },
    typeText: {
        fontSize: 14,
        color: c.textSecondary,
        fontWeight: '500',
    },
    typeTextActive: {
        color: '#FFFFFF',
    },
    lockedTypeBadge: {
        alignSelf: 'flex-start',
        backgroundColor: c.successBg,
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
        borderTopColor: c.borderLight,
        backgroundColor: c.card,
    },
    submitButton: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: "#10B981",
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
        backgroundColor: c.card,
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
        color: c.text,
    }
});
