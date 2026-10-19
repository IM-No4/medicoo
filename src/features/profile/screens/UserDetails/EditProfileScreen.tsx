import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, CheckCircle, ChevronDown, ChevronLeft, X } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
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
import OtpModal from '../../../../components/modals/OtpModal';
import StatusModal, { StatusType } from '../../../../components/modals/StatusModal';
import { sendEmailOtp, updateProfile, verifyEmailOtp } from '../../../../services/api/user.api';
import { formatDateForApi, formatDateForDisplay, formatGenderForApi, formatGenderForDisplay } from '../../../../utils/formatters';
import { useTheme } from '../../../../theme/ThemeContext';
import type { ThemeColors } from '../../../../theme/colors';
import { useLanguage } from '../../../../i18n/LanguageContext';
import { Modal } from '../../../../components/ThemedModal';
import { AuthImage } from '../../../../components/AuthImage';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function EditProfileScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();

    const { profile } = route.params || {};

    // Status Modal State
    const [statusModal, setStatusModal] = useState<{
        visible: boolean;
        status: StatusType;
        title?: string;
        message?: string;
        shouldGoBack?: boolean;
    }>({
        visible: false,
        status: 'idle',
        shouldGoBack: false
    });

    const [loading, setLoading] = useState(false);

    // State for image handling
    const [profileImageUri, setProfileImageUri] = useState<string | null>(profile?.profileImage || null);
    // Remove newBase64Image as we are using FormData now
    const [selectedImage, setSelectedImage] = useState<any>(null);

    const [formData, setFormData] = useState({
        name: profile?.name || '',
        email: profile?.email || '',
        gender: formatGenderForDisplay(profile?.gender) || '',
        dob: profile?.dob ? new Date(profile.dob).toISOString().split('T')[0] : '',
        bloodGroup: profile?.bloodGroup || '',
        tryHeight: profile?.height ? String(profile.height) : '',
        tryWeight: profile?.weight ? String(profile.weight) : '',
        address: profile?.address || '',
    });

    // Pickers State
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectionModal, setSelectionModal] = useState<{ visible: boolean; title: string; options: string[]; field: string } | null>(null);
    const [mediaPickerVisible, setMediaPickerVisible] = useState(false);

    // OTP Modal State
    const [otpModalVisible, setOtpModalVisible] = useState(false);
    const [verifying, setVerifying] = useState(false);

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    // Media Picker Logic
    const launchLibrary = async () => {
        setMediaPickerVisible(false);
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled) {
                handleImageSelected(result.assets[0]);
            }
        } catch (e) {
            setStatusModal({ visible: true, status: 'error', title: t('gallery_error'), message: t('we_couldn_t_open_your_photo_gallery_pl') });
        }
    };

    const launchCamera = async () => {
        setMediaPickerVisible(false);
        try {
            const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
            if (cameraStatus !== 'granted') {
                setStatusModal({ visible: true, status: 'warning', title: t('camera_access'), message: t('camera_permission_is_required_to_take') });
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled) {
                handleImageSelected(result.assets[0]);
            }
        } catch (e) {
            setStatusModal({ visible: true, status: 'error', title: t('camera_error'), message: t('failed_to_open_camera_please_try_again') });
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
        setLoading(true);
        setStatusModal({ visible: true, status: 'loading', message: t('updating_profile') });

        try {
            const formDataPayload = new FormData();

            // Append simple fields
            formDataPayload.append('name', formData.name);
            formDataPayload.append('gender', formatGenderForApi(formData.gender));
            formDataPayload.append('dob', formData.dob);
            formDataPayload.append('bloodGroup', formData.bloodGroup);
            formDataPayload.append('address', formData.address);
            // Note: Email is handled separately via verification, so we don't append it here if backend ignores it 
            // or we might send it but backend logic implies separate flow. 
            // The backend 'saveProfile' ignores email anyway.

            // Handle numbers
            if (formData.tryHeight) formDataPayload.append('height', String(formData.tryHeight));
            if (formData.tryWeight) formDataPayload.append('weight', String(formData.tryWeight));

            // Append image if selected
            if (selectedImage) {
                // @ts-ignore: FormData expects specific shape in React Native
                formDataPayload.append('profileImage', {
                    uri: selectedImage.uri,
                    type: selectedImage.type,
                    name: selectedImage.name,
                });
            }

            // Call the correct API function that handles multipart headers
            await updateProfile(formDataPayload);

            setStatusModal({
                visible: true,
                status: 'success',
                title: t('profile_updated'),
                message: t('your_changes_have_been_saved_successfu'),
                shouldGoBack: true,
            });

        } catch (error) {
            console.error('Update failed', error);
            setStatusModal({
                visible: true,
                status: 'error',
                title: t('update_failed'),
                message: t('could_not_update_profile_please_try_ag'),
                shouldGoBack: false,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async () => {
        if (!formData.email) {
            setStatusModal({
                visible: true,
                status: 'warning',
                title: t('email_required'),
                message: t('please_enter_an_email_address_to_proce'),
                shouldGoBack: false
            });
            return;
        }
        setVerifying(true);
        try {
            await sendEmailOtp(formData.email);
            setOtpModalVisible(true);
        } catch (error) {
            setStatusModal({
                visible: true,
                status: 'error',
                title: t('otp_error'),
                message: t('failed_to_send_verification_code_pleas'),
                shouldGoBack: false
            });
        } finally {
            setVerifying(false);
        }
    };

    const handleVerifyOtp = async (otp: string) => {
        setVerifying(true);
        try {
            await verifyEmailOtp(otp);
            setOtpModalVisible(false);
            setStatusModal({
                visible: true,
                status: 'success',
                title: t('email_verified'),
                message: t('your_email_address_has_been_verified_s'),
                shouldGoBack: false
            });
        } catch (error) {
            setStatusModal({
                visible: true,
                status: 'error',
                title: t('verification_failed'),
                message: t('invalid_or_expired_code_please_try_aga'),
                shouldGoBack: false
            });
        } finally {
            setVerifying(false);
        }
    };

    const openSelection = (title: string, options: string[], field: string) => {
        setSelectionModal({ visible: true, title, options, field });
    };

    const closeSelection = () => setSelectionModal(null);

    const selectOption = (value: string) => {
        if (selectionModal) {
            handleChange(selectionModal.field, value);
            closeSelection();
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: theme.card }}
        >
            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('edit_profile')}</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading}>
                    {loading ? <ActivityIndicator size="small" color="#10B981" /> : <Text style={styles.saveText}>Save</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Image Picker */}
                <View style={styles.imageSection}>
                    <View style={styles.imageContainer}>
                        {profileImageUri ? (
                            <AuthImage uri={profileImageUri} style={styles.avatar} />
                        ) : (
                            <View style={styles.placeholderAvatar}>
                                <Text style={styles.initials}>{formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}</Text>
                            </View>
                        )}
                        <TouchableOpacity style={styles.cameraButton} onPress={() => setMediaPickerVisible(true)}>
                            <Camera size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.changePhotoText}>{t('change_profile_photo')}</Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('full_name_2')}</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.name}
                        onChangeText={(text) => handleChange('name', text)}
                        placeholder={t('enter_your_name')}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('email_address')}</Text>
                    <View style={styles.emailRow}>
                        <TextInput
                            style={[styles.input, { flex: 1, backgroundColor: profile?.email && profile.email === formData.email ? '#F3F4F6' : '#F9FAFB' }]}
                            value={formData.email}
                            onChangeText={(text) => handleChange('email', text)}
                            placeholder={t('enter_your_email')}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        {/* Show verify button if email is not verified or has changed */}
                        {(!profile?.email || profile.email !== formData.email) && formData.email.length > 5 && (
                            <TouchableOpacity
                                style={styles.verifyButtonSmall}
                                onPress={handleSendOtp}
                                disabled={verifying}
                            >
                                {verifying ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.verifyTextSmall}>{t('verify')}</Text>}
                            </TouchableOpacity>
                        )}
                        {/* Show checkmark if verified and unchanged */}
                        {profile?.email && profile.email === formData.email && (
                            <View style={styles.verifiedIcon}>
                                <CheckCircle size={20} color="#10B981" />
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>{t('gender')}</Text>
                        <TouchableOpacity
                            style={styles.selectInput}
                            onPress={() => openSelection('Select Gender', GENDER_OPTIONS, 'gender')}
                        >
                            <Text style={[styles.selectText, !formData.gender && styles.placeholderText]}>
                                {formData.gender || 'Select'}
                            </Text>
                            <ChevronDown size={20} color={theme.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.label}>{t('date_of_birth_2')}</Text>
                        <TouchableOpacity
                            style={styles.selectInput}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={[styles.selectText, !formData.dob && styles.placeholderText]}>
                                {formData.dob ? formatDateForDisplay(formData.dob) : 'Select Date'}
                            </Text>
                            <ChevronDown size={20} color={theme.textMuted} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>{t('blood_group_2')}</Text>
                        <TouchableOpacity
                            style={styles.selectInput}
                            onPress={() => openSelection('Select Blood Group', BLOOD_GROUP_OPTIONS, 'bloodGroup')}
                        >
                            <Text style={[styles.selectText, !formData.bloodGroup && styles.placeholderText]}>
                                {formData.bloodGroup || 'Select'}
                            </Text>
                            <ChevronDown size={20} color={theme.textMuted} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>{t('height_cm')}</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.tryHeight}
                            onChangeText={(text) => handleChange('tryHeight', text)}
                            keyboardType="numeric"
                            placeholder="e.g. 175"
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.label}>{t('weight_kg')}</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.tryWeight}
                            onChangeText={(text) => handleChange('tryWeight', text)}
                            keyboardType="numeric"
                            placeholder="e.g. 70"
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('address')}</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={formData.address}
                        onChangeText={(text) => handleChange('address', text)}
                        placeholder={t('enter_your_full_address')}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Date Picker Modal/Component */}
            {showDatePicker && (
                <DateTimePicker
                    value={formData.dob ? new Date(formData.dob) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                        setShowDatePicker(Platform.OS === 'ios'); // On iOS keep open until explicitly closed or handled properly if in modal
                        if (event.type === 'set' && selectedDate) {
                            setShowDatePicker(false);
                            handleChange('dob', formatDateForApi(selectedDate));
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
                onRequestClose={closeSelection}
            >
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeSelection}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{selectionModal?.title}</Text>
                                <TouchableOpacity onPress={closeSelection}>
                                    <X size={24} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={{ maxHeight: 300 }}>
                                {selectionModal?.options.map((option) => (
                                    <TouchableOpacity
                                        key={option}
                                        style={styles.optionItem}
                                        onPress={() => selectOption(option)}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            formData[selectionModal.field as keyof typeof formData] === option && styles.selectedOptionText
                                        ]}>
                                            {option}
                                        </Text>
                                        {formData[selectionModal.field as keyof typeof formData] === option && (
                                            <View style={styles.selectedDot} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>

            <MediaPickerModal
                visible={mediaPickerVisible}
                onClose={() => setMediaPickerVisible(false)}
                onCameraSelect={launchCamera}
                onGallerySelect={launchLibrary}
                title={t('change_profile_photo')}
            />

            <StatusModal
                visible={statusModal.visible}
                status={statusModal.status}
                title={statusModal.title}
                message={statusModal.message}
                onClose={() => {
                    const wasSuccess = statusModal.status === 'success';
                    const sgb = statusModal.shouldGoBack;
                    setStatusModal(prev => ({ ...prev, visible: false }));
                    if (wasSuccess && sgb) {
                        navigation.goBack();
                    }
                }}
            />

            <OtpModal
                visible={otpModalVisible}
                email={formData.email}
                onClose={() => setOtpModalVisible(false)}
                onVerify={handleVerifyOtp}
                loading={verifying}
            />

        </KeyboardAvoidingView >
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    // Same header recipe as the rest of the Profile screens - white bar +
    // shadow, plain icon back button, fontSize 20/600/#111827 title.
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
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: c.text },
    saveText: { fontSize: 16, fontWeight: '600', color: '#10B981' },

    content: { padding: 20 },

    imageSection: { alignItems: 'center', marginBottom: 24 },
    imageContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: c.cardSecondary,
        borderWidth: 4,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    avatar: { width: '100%', height: '100%', borderRadius: 50 },
    placeholderAvatar: { width: '100%', height: '100%', borderRadius: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: c.cardSecondary },
    initials: { fontSize: 32, fontWeight: '600', color: c.textMuted },
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
    changePhotoText: { color: '#10B981', fontSize: 14, fontWeight: '600', marginTop: 12 },

    inputGroup: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '500', color: c.text, marginBottom: 8 },
    input: {
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: c.text,
        backgroundColor: c.cardSecondary,
    },
    selectInput: {
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: c.cardSecondary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectText: { fontSize: 16, color: c.text },
    placeholderText: { color: c.textMuted },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    row: { flexDirection: 'row' },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: c.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '50%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: c.borderLight,
    },
    modalTitle: { fontSize: 18, fontWeight: '600', color: c.text },
    optionItem: {
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    optionText: { fontSize: 16, color: c.text },
    selectedOptionText: { color: '#10B981', fontWeight: '600' },
    selectedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },

    emailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    verifyButtonSmall: {
        backgroundColor: '#10B981',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    verifyTextSmall: { color: '#fff', fontWeight: '600', fontSize: 13 },
    verifiedIcon: { padding: 12 },
});
