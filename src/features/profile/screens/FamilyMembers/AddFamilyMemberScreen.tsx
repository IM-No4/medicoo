import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Calendar, Camera, ChevronDown, ChevronLeft, User, X } from 'lucide-react-native';
import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MediaPickerModal from '../../../../components/modals/image-picker/MediaPickerModal';
import StatusModal, { StatusType } from '../../../../components/modals/StatusModal';
import { addFamilyMember } from '../../../../services/api';
import { formatDateForApi, formatDateForDisplay } from '../../../../utils/formatters';
import { useTheme } from '../../../../theme/ThemeContext';
import type { ThemeColors } from '../../../../theme/colors';
import { useLanguage } from '../../../../i18n/LanguageContext';
import { Modal } from '../../../../components/ThemedModal';
import { AuthImage } from '../../../../components/AuthImage';

const RELATIONS = [
    { label: 'Spouse', value: 'spouse' },
    { label: 'Son', value: 'son' },
    { label: 'Daughter', value: 'daughter' },
    { label: 'Father', value: 'father' },
    { label: 'Mother', value: 'mother' },
    { label: 'Brother', value: 'brother' },
    { label: 'Sister', value: 'sister' },
    { label: 'Grandfather', value: 'grandfather' },
    { label: 'Grandmother', value: 'grandmother' },
    { label: 'Other', value: 'other' }
];

const GENDERS = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' }
];

export default function AddFamilyMemberScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    const navigation = useNavigation();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();

    const isEditing = route.params?.isEditing || false;
    const existingMember = route.params?.member;

    const [saving, setSaving] = useState(false);
    const [mode, setMode] = useState<'create' | 'link'>('create');

    // Create Mode State
    const [formData, setFormData] = useState({
        name: '',
        relation: '',
        dob: '',
        gender: '',
    });

    const [showDatePicker, setShowDatePicker] = useState(false);

    // Link Mode State
    const [linkId, setLinkId] = useState('');
    const [linkRelation, setLinkRelation] = useState('');

    // Status Modal State
    const [statusVisible, setStatusVisible] = useState(false);
    const [statusMode, setStatusMode] = useState<StatusType>('idle');
    const [statusTitle, setStatusTitle] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    // Image State
    const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<any>(null);
    const [mediaPickerVisible, setMediaPickerVisible] = useState(false);

    // Selection Modal State
    const [selectionModal, setSelectionModal] = useState<{
        visible: boolean;
        title: string;
        options: { label: string; value: string }[];
        field: 'gender' | 'relation' | 'linkRelation';
    } | null>(null);

    useEffect(() => {
        if (isEditing && existingMember) {
            setFormData({
                name: existingMember.name,
                relation: existingMember.relation,
                dob: existingMember.dob || '',
                gender: existingMember.gender,
            });
            if (existingMember.profileImage) {
                setProfileImageUri(existingMember.profileImage);
            }
        }
    }, [isEditing, existingMember]);

    // Image Picker Handlers
    const launchLibrary = async () => {
        setMediaPickerVisible(false);
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled) {
                handleImageSelected(result.assets[0]);
            }
        } catch (e) {
            showStatus('error', t('error'), t('failed_to_open_gallery'));
        }
    };

    const launchCamera = async () => {
        setMediaPickerVisible(false);
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                showStatus('warning', t('permission_needed'), t('camera_permission_is_required_to_take_2'));
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled) {
                handleImageSelected(result.assets[0]);
            }
        } catch (e) {
            showStatus('error', t('error'), t('failed_to_open_camera'));
        }
    };

    const handleImageSelected = (asset: ImagePicker.ImagePickerAsset) => {
        setProfileImageUri(asset.uri);
        setSelectedImage({
            uri: asset.uri,
            type: asset.mimeType || 'image/jpeg',
            name: asset.fileName || `profile_${Date.now()}.jpg`,
        });
    };

    const handleSave = async () => {
        try {
            if (mode === 'link' && !isEditing) {
                if (!linkId.trim()) {
                    showStatus('warning', t('validation_error'), t('please_enter_a_med_id'));
                    return;
                }
                if (!linkRelation) {
                    showStatus('warning', t('validation_error'), t('please_select_a_relation'));
                    return;
                }

                setStatusMode('loading');
                setStatusMessage('Sending link request...');
                setStatusVisible(true);

                await addFamilyMember({
                    med_id: linkId,
                    relation: linkRelation,
                    relationship: linkRelation
                });
            } else {
                if (!formData.name.trim()) {
                    showStatus('warning', t('validation_error'), t('please_enter_a_name'));
                    return;
                }
                if (!formData.relation) {
                    showStatus('warning', t('validation_error'), t('please_select_a_relation'));
                    return;
                }
                if (!formData.dob) {
                    showStatus('warning', t('validation_error'), t('please_select_a_date_of_birth'));
                    return;
                }
                if (!formData.gender) {
                    showStatus('warning', t('validation_error'), t('please_select_a_gender'));
                    return;
                }

                setStatusMode('loading');
                setStatusMessage(isEditing ? 'Updating details...' : 'Adding family member...');
                setStatusVisible(true);

                const data = new FormData();
                data.append('name', formData.name);
                data.append('relation', formData.relation);
                data.append('relationship', formData.relation); // Fallback key
                data.append('dob', formData.dob);
                data.append('gender', formData.gender);

                // Calculate and add age as String as per schema
                const years = new Date().getFullYear() - new Date(formData.dob).getFullYear();
                data.append('age', years.toString());

                if (selectedImage) {
                    // @ts-ignore
                    data.append('profileImage', {
                        uri: selectedImage.uri,
                        type: selectedImage.type,
                        name: selectedImage.name,
                    });
                }

                await addFamilyMember(data);
            }

            showStatus(
                'success',
                t('success'),
                `Family member ${isEditing ? 'updated' : (mode === 'link' ? 'link request sent' : 'added')} successfully.`
            );

        } catch (error: any) {
            console.error(error);
            const message = error?.response?.data?.message || 'Failed to save family member details.';
            showStatus('error', t('error'), message);
        }
    };

    const showStatus = (type: StatusType, title: string, message: string) => {
        setStatusMode(type);
        setStatusTitle(title);
        setStatusMessage(message);
        setStatusVisible(true);
    };

    const handleStatusClose = () => {
        setStatusVisible(false);
        if (statusMode === 'success') {
            navigation.goBack();
        }
    };

    const openSelection = (field: 'gender' | 'relation' | 'linkRelation') => {
        let title = '';
        let options: { label: string, value: string }[] = [];

        if (field === 'gender') {
            title = 'Select Gender';
            options = GENDERS;
        } else if (field === 'relation' || field === 'linkRelation') {
            title = 'Select Relation';
            options = RELATIONS;
        }

        setSelectionModal({ visible: true, title, options, field });
    };

    const handleSelectOption = (optionValue: string) => {
        if (!selectionModal) return;

        if (selectionModal.field === 'gender') {
            setFormData({ ...formData, gender: optionValue });
        } else if (selectionModal.field === 'relation') {
            setFormData({ ...formData, relation: optionValue });
        } else if (selectionModal.field === 'linkRelation') {
            setLinkRelation(optionValue);
        }

        setSelectionModal(null);
    };

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEditing ? 'Edit Details' : 'Add Family Member'}</Text>
                <View style={{ width: 40 }} />
            </View>

            {!isEditing && (
                        <View style={styles.tabsWrapper}>
                            <View style={styles.tabContainer}>
                                <TouchableOpacity
                                    style={[styles.tab, mode === 'create' && styles.activeTab]}
                                    onPress={() => setMode('create')}
                                    activeOpacity={0.7}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Text style={[styles.tabText, mode === 'create' && styles.activeTabText]}>{t('create_new')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.tab, mode === 'link' && styles.activeTab]}
                                    onPress={() => setMode('link')}
                                    activeOpacity={0.7}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Text style={[styles.tabText, mode === 'link' && styles.activeTabText]}>{t('link_existing')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={styles.content}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >

                {mode === 'create' ? (
                    <>
                        <View style={styles.avatarSection}>
                            <View style={styles.avatarCircle}>
                                {profileImageUri ? (
                                    <AuthImage uri={profileImageUri} style={styles.avatarImage} />
                                ) : (
                                    <User size={40} color="#10B981" />
                                )}
                                <TouchableOpacity
                                    style={styles.cameraButton}
                                    onPress={() => setMediaPickerVisible(true)}
                                >
                                    <Camera size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={() => setMediaPickerVisible(true)}>
                                <Text style={styles.uploadText}>{profileImageUri ? 'Change Photo' : 'Upload Photo'}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>{t('Full Name *')}</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('enter_full_name')}
                                    value={formData.name}
                                    onChangeText={(t) => setFormData({ ...formData, name: t })}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>{t('Relation *')}</Text>
                                <View style={styles.chipContainer}>
                                    {RELATIONS.map(rel => (
                                        <TouchableOpacity
                                            key={rel.value}
                                            style={[
                                                styles.chip,
                                                formData.relation === rel.value && styles.chipActive
                                            ]}
                                            onPress={() => setFormData({ ...formData, relation: rel.value })}
                                        >
                                            <Text style={[
                                                styles.chipText,
                                                formData.relation === rel.value && styles.chipTextActive
                                            ]}>{t(rel.label)}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>{t('Date of Birth *')}</Text>
                                <TouchableOpacity
                                    style={styles.dateInput}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={[styles.dateText, !formData.dob && styles.placeholderText]}>
                                        {formData.dob ? formatDateForDisplay(formData.dob) : 'Select Date of Birth'}
                                    </Text>
                                    <Calendar size={18} color={theme.textMuted} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>{t('Gender *')}</Text>
                                <TouchableOpacity
                                    style={styles.dropdownTrigger}
                                    onPress={() => openSelection('gender')}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.dropdownText, !formData.gender && styles.placeholderText]}>
                                        {GENDERS.find(g => g.value === formData.gender)?.label || 'Select Gender'}
                                    </Text>
                                    <ChevronDown size={20} color={theme.textMuted} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                ) : (
                    <View style={styles.form}>
                        <View style={styles.infoBox}>
                            <Text style={styles.infoText}>
                                {t('enter_the_med_id_of_the_family_member')}
                            </Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('MED ID *')}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={t('enter_med_id_e_g_med_123456')}
                                value={linkId}
                                onChangeText={setLinkId}
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>{t('Relation *')}</Text>
                            <View style={styles.chipContainer}>
                                {RELATIONS.map(rel => (
                                    <TouchableOpacity
                                        key={rel.value}
                                        style={[
                                            styles.chip,
                                            linkRelation === rel.value && styles.chipActive
                                        ]}
                                        onPress={() => setLinkRelation(rel.value)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            linkRelation === rel.value && styles.chipTextActive
                                        ]}>{t(rel.label)}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>
                            {isEditing
                                ? 'Update Member'
                                : (mode === 'link' ? 'Link Member' : 'Save Member')
                            }
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {showDatePicker && (
                <DateTimePicker
                    value={formData.dob ? new Date(formData.dob) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                        setShowDatePicker(Platform.OS === 'ios');
                        if (event.type === 'set' && selectedDate) {
                            setShowDatePicker(false);
                            setFormData({ ...formData, dob: formatDateForApi(selectedDate) });
                        } else if (event.type === 'dismissed') {
                            setShowDatePicker(false);
                        }
                    }}
                    maximumDate={new Date()}
                />
            )}

            {/* Selection Modal */}
            <Modal
                visible={!!selectionModal}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectionModal(null)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setSelectionModal(null)}
                >
                    <TouchableWithoutFeedback>
                        <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
                            <View style={styles.pickerModalHeader}>
                                <Text style={styles.modalTitle}>{selectionModal?.title}</Text>
                                <TouchableOpacity onPress={() => setSelectionModal(null)}>
                                    <X size={24} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={{ maxHeight: 300 }}>
                                {selectionModal?.options.map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={styles.optionItem}
                                        onPress={() => handleSelectOption(option.value)}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            (selectionModal.field === 'gender' ? formData.gender :
                                                selectionModal.field === 'relation' ? formData.relation :
                                                    linkRelation) === option.value && styles.selectedOptionText
                                        ]}>
                                            {t(option.label)}
                                        </Text>
                                        {(selectionModal.field === 'gender' ? formData.gender :
                                            selectionModal.field === 'relation' ? formData.relation :
                                                linkRelation) === option.value && (
                                                <View style={styles.selectedDot} />
                                            )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>

            <StatusModal
                visible={statusVisible}
                status={statusMode}
                title={statusTitle}
                message={statusMessage}
                onClose={handleStatusClose}
            />

            <MediaPickerModal
                visible={mediaPickerVisible}
                onClose={() => setMediaPickerVisible(false)}
                onCameraSelect={launchCamera}
                onGallerySelect={launchLibrary}
                title={t('change_photo')}
            />
        </KeyboardAvoidingView>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: c.background,
    },
    // Same white bar + shadow + title treatment as the Calendar/Records/
    // Health screen headers, so this reads as a real screen rather than a
    // bottom sheet.
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 16,
        backgroundColor: c.card,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
            android: { elevation: 2 },
        }),
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: c.text,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    tabsWrapper: {
        paddingHorizontal: 20,
        paddingTop: 16,
        backgroundColor: c.cardSecondary,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: c.card,
        padding: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: c.border,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: c.successBg,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: c.textSecondary,
    },
    activeTabText: {
        color: '#10B981',
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: c.successBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: c.isDark ? 'rgba(16,185,129,0.25)' : '#DCFCE7',
        position: 'relative',
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#10B981',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    uploadText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10B981',
    },
    form: {
        gap: 20,
    },
    infoBox: {
        backgroundColor: c.infoBg,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    infoText: {
        color: '#1E40AF',
        fontSize: 14,
        lineHeight: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: c.text,
        marginLeft: 4,
    },
    input: {
        backgroundColor: c.card,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: c.text,
    },
    dateInput: {
        backgroundColor: c.card,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 52,
    },
    dropdownTrigger: {
        backgroundColor: c.card,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 52,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: c.card,
        borderWidth: 1,
        borderColor: c.border,
    },
    chipActive: {
        backgroundColor: c.successBg,
        borderColor: '#10B981',
    },
    chipText: {
        fontSize: 12,
        color: c.textSecondary,
        fontWeight: '500',
    },
    chipTextActive: {
        color: '#10B981',
        fontWeight: '600',
    },
    dropdownText: {
        fontSize: 16,
        color: c.text,
    },
    dateText: {
        fontSize: 16,
        color: c.text,
    },
    placeholderText: {
        color: c.textMuted,
    },
    row: {
        flexDirection: 'row',
    },
    footer: {
        backgroundColor: c.card,
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: c.borderLight,
    },
    saveButton: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: c.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
    },
    pickerModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: c.text,
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: c.borderLight,
    },
    optionText: {
        fontSize: 16,
        color: c.textSecondary,
    },
    selectedOptionText: {
        color: '#10B981',
        fontWeight: '600',
    },
    selectedDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
    },
});
