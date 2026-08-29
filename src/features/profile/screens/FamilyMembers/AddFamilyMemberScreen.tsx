import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Calendar, Camera, ChevronDown, ChevronLeft, User, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MediaPickerModal from '../../../../components/modals/image-picker/MediaPickerModal';
import StatusModal, { StatusType } from '../../../../components/modals/StatusModal';
import { addFamilyMember } from '../../../../services/api';
import { formatDateForApi, formatDateForDisplay } from '../../../../utils/formatters';

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
                setProfileImageUri(
                    existingMember.profileImage.startsWith('http')
                        ? existingMember.profileImage
                        : `data:image/jpeg;base64,${existingMember.profileImage}`
                );
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
            showStatus('error', 'Error', 'Failed to open gallery');
        }
    };

    const launchCamera = async () => {
        setMediaPickerVisible(false);
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                showStatus('warning', 'Permission needed', 'Camera permission is required to take photos.');
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
            showStatus('error', 'Error', 'Failed to open camera');
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
                    showStatus('warning', 'Validation Error', 'Please enter a MED ID.');
                    return;
                }
                if (!linkRelation) {
                    showStatus('warning', 'Validation Error', 'Please select a relation.');
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
                    showStatus('warning', 'Validation Error', 'Please enter a name.');
                    return;
                }
                if (!formData.relation) {
                    showStatus('warning', 'Validation Error', 'Please select a relation.');
                    return;
                }
                if (!formData.dob) {
                    showStatus('warning', 'Validation Error', 'Please select a date of birth.');
                    return;
                }
                if (!formData.gender) {
                    showStatus('warning', 'Validation Error', 'Please select a gender.');
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
                'Success',
                `Family member ${isEditing ? 'updated' : (mode === 'link' ? 'link request sent' : 'added')} successfully.`
            );

        } catch (error: any) {
            console.error(error);
            const message = error?.response?.data?.message || 'Failed to save family member details.';
            showStatus('error', 'Error', message);
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
            <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color="#111827" />
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
                                    <Text style={[styles.tabText, mode === 'create' && styles.activeTabText]}>Create New</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.tab, mode === 'link' && styles.activeTab]}
                                    onPress={() => setMode('link')}
                                    activeOpacity={0.7}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Text style={[styles.tabText, mode === 'link' && styles.activeTabText]}>Link Existing</Text>
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
                                    <Image source={{ uri: profileImageUri }} style={styles.avatarImage} />
                                ) : (
                                    <User size={40} color="#0FBBA1" />
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
                                <Text style={styles.label}>Full Name *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter full name"
                                    value={formData.name}
                                    onChangeText={(t) => setFormData({ ...formData, name: t })}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Relation *</Text>
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
                                            ]}>{rel.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Date of Birth *</Text>
                                <TouchableOpacity
                                    style={styles.dateInput}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={[styles.dateText, !formData.dob && styles.placeholderText]}>
                                        {formData.dob ? formatDateForDisplay(formData.dob) : 'Select Date of Birth'}
                                    </Text>
                                    <Calendar size={18} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Gender *</Text>
                                <TouchableOpacity
                                    style={styles.dropdownTrigger}
                                    onPress={() => openSelection('gender')}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.dropdownText, !formData.gender && styles.placeholderText]}>
                                        {GENDERS.find(g => g.value === formData.gender)?.label || 'Select Gender'}
                                    </Text>
                                    <ChevronDown size={20} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                ) : (
                    <View style={styles.form}>
                        <View style={styles.infoBox}>
                            <Text style={styles.infoText}>
                                Enter the MED ID of the family member you want to link. They must already have a Medicoo account.
                            </Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>MED ID *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter MED ID (e.g. MED-123456)"
                                value={linkId}
                                onChangeText={setLinkId}
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Relation *</Text>
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
                                        ]}>{rel.label}</Text>
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
                                    <X size={24} color="#6B7280" />
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
                                            {option.label}
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
                title="Change Photo"
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F8F9FE',
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
        backgroundColor: '#fff',
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
        color: '#111827',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    tabsWrapper: {
        paddingHorizontal: 20,
        paddingTop: 16,
        backgroundColor: '#F8F9FE',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#F0FDF4',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#0FBBA1',
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#DCFCE7',
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
        backgroundColor: '#0FBBA1',
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
        color: '#0FBBA1',
    },
    form: {
        gap: 20,
    },
    infoBox: {
        backgroundColor: '#EFF6FF',
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
        color: '#374151',
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1F2937',
    },
    dateInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 52,
    },
    dropdownTrigger: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
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
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    chipActive: {
        backgroundColor: '#F0FDF4',
        borderColor: '#0FBBA1',
    },
    chipText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    chipTextActive: {
        color: '#0FBBA1',
        fontWeight: '600',
    },
    dropdownText: {
        fontSize: 16,
        color: '#1F2937',
    },
    dateText: {
        fontSize: 16,
        color: '#1F2937',
    },
    placeholderText: {
        color: '#9CA3AF',
    },
    row: {
        flexDirection: 'row',
    },
    footer: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    saveButton: {
        backgroundColor: '#0FBBA1',
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
        backgroundColor: '#fff',
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
        color: '#1F2937',
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    optionText: {
        fontSize: 16,
        color: '#4B5563',
    },
    selectedOptionText: {
        color: '#0FBBA1',
        fontWeight: '600',
    },
    selectedDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#0FBBA1',
    },
});
