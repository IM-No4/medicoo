import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, CheckCircle, ChevronDown, ChevronLeft, X } from 'lucide-react-native';
import React, { useState } from 'react';
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
import OtpModal from '../../../../components/modals/OtpModal';
import StatusModal, { StatusType } from '../../../../components/modals/StatusModal';
import { sendEmailOtp, updateProfile, verifyEmailOtp } from '../../../../services/api/user.api';
import { formatDateForApi, formatDateForDisplay, formatGenderForApi, formatGenderForDisplay } from '../../../../utils/formatters';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function EditProfileScreen() {
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
    const [profileImageUri, setProfileImageUri] = useState<string | null>(
        profile?.profileImage
            ? (profile.profileImage.startsWith('http') ? profile.profileImage : `data:image/jpeg;base64,${profile.profileImage}`)
            : null
    );
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
            setStatusModal({ visible: true, status: 'error', title: 'Gallery Error', message: 'We couldn\'t open your photo gallery. Please check app permissions.' });
        }
    };

    const launchCamera = async () => {
        setMediaPickerVisible(false);
        try {
            const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
            if (cameraStatus !== 'granted') {
                setStatusModal({ visible: true, status: 'warning', title: 'Camera Access', message: 'Camera permission is required to take a profile photo.' });
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
            setStatusModal({ visible: true, status: 'error', title: 'Camera Error', message: 'Failed to open camera. Please try again.' });
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
        setStatusModal({ visible: true, status: 'loading', message: 'Updating profile...' });

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
                title: 'Profile Updated',
                message: 'Your changes have been saved successfully.',
                shouldGoBack: true,
            });

        } catch (error) {
            console.error('Update failed', error);
            setStatusModal({
                visible: true,
                status: 'error',
                title: 'Update Failed',
                message: 'Could not update profile. Please try again.',
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
                title: 'Email Required',
                message: 'Please enter an email address to proceed.',
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
                title: 'OTP Error',
                message: 'Failed to send verification code. Please try again.',
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
                title: 'Email Verified',
                message: 'Your email address has been verified successfully.',
                shouldGoBack: false
            });
        } catch (error) {
            setStatusModal({
                visible: true,
                status: 'error',
                title: 'Verification Failed',
                message: 'Invalid or expired code. Please try again.',
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
            style={{ flex: 1, backgroundColor: '#fff' }}
        >
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading}>
                    {loading ? <ActivityIndicator size="small" color="#2FA561" /> : <Text style={styles.saveText}>Save</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Image Picker */}
                <View style={styles.imageSection}>
                    <View style={styles.imageContainer}>
                        {profileImageUri ? (
                            <Image source={{ uri: profileImageUri }} style={styles.avatar} />
                        ) : (
                            <View style={styles.placeholderAvatar}>
                                <Text style={styles.initials}>{formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}</Text>
                            </View>
                        )}
                        <TouchableOpacity style={styles.cameraButton} onPress={() => setMediaPickerVisible(true)}>
                            <Camera size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.changePhotoText}>Change Profile Photo</Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.name}
                        onChangeText={(text) => handleChange('name', text)}
                        placeholder="Enter your name"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <View style={styles.emailRow}>
                        <TextInput
                            style={[styles.input, { flex: 1, backgroundColor: profile?.email && profile.email === formData.email ? '#F3F4F6' : '#F9FAFB' }]}
                            value={formData.email}
                            onChangeText={(text) => handleChange('email', text)}
                            placeholder="Enter your email"
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
                                {verifying ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.verifyTextSmall}>Verify</Text>}
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
                        <Text style={styles.label}>Gender</Text>
                        <TouchableOpacity
                            style={styles.selectInput}
                            onPress={() => openSelection('Select Gender', GENDER_OPTIONS, 'gender')}
                        >
                            <Text style={[styles.selectText, !formData.gender && styles.placeholderText]}>
                                {formData.gender || 'Select'}
                            </Text>
                            <ChevronDown size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.label}>Date of Birth</Text>
                        <TouchableOpacity
                            style={styles.selectInput}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={[styles.selectText, !formData.dob && styles.placeholderText]}>
                                {formData.dob ? formatDateForDisplay(formData.dob) : 'Select Date'}
                            </Text>
                            <ChevronDown size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>Blood Group</Text>
                        <TouchableOpacity
                            style={styles.selectInput}
                            onPress={() => openSelection('Select Blood Group', BLOOD_GROUP_OPTIONS, 'bloodGroup')}
                        >
                            <Text style={[styles.selectText, !formData.bloodGroup && styles.placeholderText]}>
                                {formData.bloodGroup || 'Select'}
                            </Text>
                            <ChevronDown size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>Height (cm)</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.tryHeight}
                            onChangeText={(text) => handleChange('tryHeight', text)}
                            keyboardType="numeric"
                            placeholder="e.g. 175"
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.label}>Weight (kg)</Text>
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
                    <Text style={styles.label}>Address</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={formData.address}
                        onChangeText={(text) => handleChange('address', text)}
                        placeholder="Enter your full address"
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
                                    <X size={24} color="#6B7280" />
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
                title="Change Profile Photo"
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

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#fff',
    },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
    saveText: { fontSize: 16, fontWeight: '600', color: '#2FA561' },

    content: { padding: 20 },

    imageSection: { alignItems: 'center', marginBottom: 24 },
    imageContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F3F4F6',
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
    placeholderAvatar: { width: '100%', height: '100%', borderRadius: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5E7EB' },
    initials: { fontSize: 32, fontWeight: '600', color: '#9CA3AF' },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#2FA561',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    changePhotoText: { color: '#2FA561', fontSize: 14, fontWeight: '600', marginTop: 12 },

    inputGroup: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 8 },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1F2937',
        backgroundColor: '#F9FAFB',
    },
    selectInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F9FAFB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectText: { fontSize: 16, color: '#1F2937' },
    placeholderText: { color: '#9CA3AF' },
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
        backgroundColor: '#fff',
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
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
    optionItem: {
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    optionText: { fontSize: 16, color: '#374151' },
    selectedOptionText: { color: '#2FA561', fontWeight: '600' },
    selectedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2FA561' },

    emailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    verifyButtonSmall: {
        backgroundColor: '#2FA561',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    verifyTextSmall: { color: '#fff', fontWeight: '600', fontSize: 13 },
    verifiedIcon: { padding: 12 },
});
