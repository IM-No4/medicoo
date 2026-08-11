import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Calendar, Check, ChevronDown, ChevronLeft, Upload, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
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
import { API_BASE_URL } from '../../../../services/api/client';
import { applyAsDoctor, getDoctorProfile, updateDoctorDraft } from '../../../../services/api/user.api';

const DOCTOR_TYPES = ['MBBS', 'MD', 'MS', 'BDS', 'MDS', 'BAMS', 'BHMS', 'Specialist', 'Other'];
const SPECIALIZATIONS = [
    'General Physician', 'Cardiologist', 'Dermatologist', 'Pediatrician',
    'Gynecologist', 'Orthopedic', 'Neurologist', 'Psychiatrist',
    'ENT Specialist', 'Ophthalmologist', 'Dentist', 'Other'
];
const STATE_COUNCILS = [
    'NMC', 'Andhra Pradesh Medical Council', 'Delhi Medical Council',
    'Maharashtra Medical Council', 'Karnataka Medical Council',
    'Tamil Nadu Medical Council', 'West Bengal Medical Council', 'Other'
];
const IDENTITY_PROOF_TYPES = [
    'PAN',
    'Aadhaar',
    'Drivers_License',
    'Passport'
];
const CERTIFICATE_TYPES = ['Degree', 'Diploma', 'Fellowship', 'Membership', 'Award', 'Other'];

// Steps Enum
enum OnboardingStep {
    BASIC_DETAILS = 1,
    CONSULTATION_FEES = 2,
    DOCUMENTS = 3,
    REVIEW = 4,
}

const TOTAL_STEPS = 4;


export default function DoctorOnboardingScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    const [currentStep, setCurrentStep] = useState<OnboardingStep>(OnboardingStep.BASIC_DETAILS);
    const [loading, setLoading] = useState(false);
    const [selectionModal, setSelectionModal] = useState<{ visible: boolean; title: string; options: string[]; field: string } | null>(null);
    const [mediaPickerVisible, setMediaPickerVisible] = useState(false);
    const [activeUploadField, setActiveUploadField] = useState<string | null>(null);

    // Temp Document State
    const [tempDoc, setTempDoc] = useState({ type: '', number: '', expiry: '', file: null as any });
    const [isAddingDoc, setIsAddingDoc] = useState(false);

    // Status Modal State
    const [statusModal, setStatusModal] = useState<{
        visible: boolean;
        status: StatusType;
        title?: string;
        message?: string;
        onCloseAction?: () => void;
        primaryAction?: () => void;
        primaryActionText?: string;
    }>({
        visible: false,
        status: 'idle',
    });

    // Form State - Matching backend schema
    const [approvalStatus, setApprovalStatus] = useState<string>('not-applied');
    const [rejectionReason, setRejectionReason] = useState<string>('');
    const [isReadOnly, setIsReadOnly] = useState(false);

    const [formData, setFormData] = useState({
        // Step 1 - Eligibility
        telemedicineConsent: false,

        // Step 2 - Professional Info
        doctorType: '',
        specialization: '',
        specializationCode: '',
        experience: '',
        languages: '',
        hospital: '',
        description: '',

        registrationNumber: '', // Keeping for legacy/display if needed, but primary are nmc/state below

        // Detailed Registration & Documents
        nmcRegistrationNumber: '',

        stateMedicalCouncil: '',
        stateCouncilRegistrationNumber: '',
        stateCouncilValidTill: '', // Date string DD/MM/YYYY

        identityProofType: '',
        identityProofNumber: '',
        identityProofValidTill: '',
        identityProofDocument: null as any,

        cmeCertificate: null as any,
        cmeIssuedAt: '',
        cmeValidTill: '',

        // Malpractice
        hasMalpracticeHistory: false,
        malpracticeNotes: '',

        certificates: [] as any[], // Additional certificates
        uniformPhoto: null as any,

        // Step 4 - Consultation Fees
        consultationFees: {
            currency: 'INR',
            chat: { fee: 0, isEnabled: false },
            voice: { fee: 0, isEnabled: false },
            video: { fee: 0, isEnabled: false },
        },
    });

    const updateField = (key: string, value: any) => {
        if (isReadOnly) return;
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    // Date Picker Logic
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateField, setDateField] = useState<string | null>(null);

    const openDatePicker = (field: string) => {
        if (isReadOnly) return;
        setDateField(field);
        setShowDatePicker(true);
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (event.type === 'set' && selectedDate && dateField) {
            // Format: DD/MM/YYYY with leading zeros
            const day = selectedDate.getDate().toString().padStart(2, '0');
            const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
            const year = selectedDate.getFullYear();
            const formatted = `${day}/${month}/${year}`;

            if (dateField === 'tempDocExpiry') {
                setTempDoc(prev => ({ ...prev, expiry: formatted }));
            } else {
                updateField(dateField, formatted);
            }
        }
        setDateField(null);
    };

    const getDatePickerValue = () => {
        if (!dateField) return new Date();
        let val = '';
        if (dateField === 'tempDocExpiry') val = tempDoc.expiry;
        else val = (formData as any)[dateField];

        if (!val) return new Date();
        const parts = val.split('/');
        if (parts.length === 3) {
            const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            if (!isNaN(d.getTime())) return d;
        }
        return new Date();
    };

    // Load existing draft on mount
    useFocusEffect(
        useCallback(() => {
            loadDoctorProfile();
        }, [])
    );

    const loadDoctorProfile = async () => {
        try {
            setLoading(true);
            const profile = await getDoctorProfile();

            if (profile) {
                // Determine source of data - prefer pendingProfile if it exists (usually for drafts)
                // Use profile._doc if available (sometimes axios returns the raw mongoose document)
                const source = profile.pendingProfile || profile._doc || profile;

                // Determine Mode based on approvalStatus
                const status = profile.approvalStatus || 'not-applied';
                setApprovalStatus(status);
                setRejectionReason(profile.rejectionReason || '');

                // Pending state is strictly read-only
                if (status === 'pending') {
                    setIsReadOnly(true);
                } else {
                    setIsReadOnly(false);
                }

                // Helper to normalize file data from string paths
                const normalizeFile = (fileData: any, defaultName: string) => {
                    if (!fileData) return null;
                    if (typeof fileData === 'string') {
                        const uri = (fileData.startsWith('http') || fileData.startsWith('data:'))
                            ? fileData
                            : `${API_BASE_URL}/${fileData}`;
                        return { uri: uri, name: defaultName, type: 'image/jpeg' };
                    }
                    return fileData;
                };

                // Populate form data
                setFormData({
                    telemedicineConsent: profile.telemedicineConsent?.accepted || source.telemedicineConsent?.accepted || false,
                    doctorType: source.doctorType || '',
                    specialization: source.specialization || '',
                    specializationCode: source.specializationCode || '',
                    experience: source.experience?.toString() || '',
                    languages: Array.isArray(source.languages) ? source.languages.join(', ') : (source.languages || ''),
                    hospital: source.hospital || '',
                    description: source.description || '',
                    registrationNumber: source.registrationNumber || '',

                    // New Fields Mapping - Check source (draft) then verification (approved/rejected)
                    nmcRegistrationNumber: source.nmcRegistrationNumber || source.verification?.nmcRegistrationNumber || source.registrationNumber || '',
                    stateMedicalCouncil: source.stateMedicalCouncil || source.verification?.stateMedicalCouncil || '',
                    stateCouncilRegistrationNumber: source.stateCouncilRegistrationNumber || source.verification?.stateCouncilRegistrationNumber || '',
                    stateCouncilValidTill: (source.stateCouncilValidTill || source.verification?.stateCouncilValidTill)
                        ? new Date(source.stateCouncilValidTill || source.verification?.stateCouncilValidTill).toLocaleDateString('en-GB')
                        : '',

                    identityProofType: source.identityProofType || source.verification?.identityProofType || '',
                    identityProofNumber: source.identityProofNumber || source.verification?.identityProofNumber || '',
                    identityProofValidTill: (source.identityProofValidTill || source.verification?.identityProofValidTill)
                        ? new Date(source.identityProofValidTill || source.verification?.identityProofValidTill).toLocaleDateString('en-GB')
                        : '',
                    identityProofDocument: normalizeFile(source.identityProofDocument || source.verification?.identityProofDocument, 'ID Proof'),

                    cmeCertificate: normalizeFile(source.cmeCertificate || source.verification?.cmeCertificate, 'CME Certificate'),
                    cmeIssuedAt: (source.cmeIssuedAt || source.verification?.cmeIssuedAt)
                        ? new Date(source.cmeIssuedAt || source.verification?.cmeIssuedAt).toLocaleDateString('en-GB')
                        : '',
                    cmeValidTill: (source.cmeValidTill || source.verification?.cmeValidTill)
                        ? new Date(source.cmeValidTill || source.verification?.cmeValidTill).toLocaleDateString('en-GB')
                        : '',

                    hasMalpracticeHistory: source.hasMalpracticeHistory === undefined
                        ? (source.verification?.hasMalpracticeHistory || false)
                        : !!source.hasMalpracticeHistory,
                    malpracticeNotes: source.malpracticeNotes || source.verification?.malpracticeNotes || '',

                    certificates: Array.isArray(source.certificates)
                        ? source.certificates
                            .filter((cert: any) => {
                                const uri = typeof cert === 'string' ? cert : cert.file?.uri || cert.uri;
                                const mainDocs = [
                                    source.identityProofDocument || source.verification?.identityProofDocument,
                                    source.cmeCertificate || source.verification?.cmeCertificate,
                                    source.uniformPhoto
                                ].map(doc => doc?.uri || doc);
                                return !mainDocs.includes(uri);
                            })
                            .map((cert: any, index: number) => {
                                if (typeof cert === 'string') {
                                    return {
                                        type: 'Other',
                                        number: '',
                                        expiry: '',
                                        file: { uri: cert, name: `Certificate ${index + 1}`, type: 'image/jpeg' }
                                    };
                                }
                                return cert;
                            })
                        : [],
                    uniformPhoto: normalizeFile(source.uniformPhoto, 'Profile Photo'),
                    consultationFees: {
                        currency: source.consultationFees?.currency || 'INR',
                        chat: {
                            fee: typeof source.consultationFees?.chat === 'object' ? source.consultationFees.chat.fee : (Number(source.consultationFees?.chat) || 0),
                            isEnabled: typeof source.consultationFees?.chat === 'object' ? source.consultationFees.chat.isEnabled : false
                        },
                        voice: {
                            fee: typeof source.consultationFees?.voice === 'object' ? source.consultationFees.voice.fee : (Number(source.consultationFees?.voice) || 0),
                            isEnabled: typeof source.consultationFees?.voice === 'object' ? source.consultationFees.voice.isEnabled : false
                        },
                        video: {
                            fee: typeof source.consultationFees?.video === 'object' ? source.consultationFees.video.fee : (Number(source.consultationFees?.video) || 0),
                            isEnabled: typeof source.consultationFees?.video === 'object' ? source.consultationFees.video.isEnabled : false
                        },
                    },
                });
            }
        } catch (error) {
            // Error loading profile
        } finally {
            setLoading(false);
        }
    };

    const prepareFormData = () => {
        const formDataToSend = new FormData();

        // Append text fields
        if (formData.doctorType) formDataToSend.append('doctorType', formData.doctorType);
        if (formData.specialization) formDataToSend.append('specialization', formData.specialization);
        if (formData.specializationCode) formDataToSend.append('specializationCode', formData.specializationCode);
        if (formData.experience) formDataToSend.append('experience', formData.experience);
        if (formData.languages) formDataToSend.append('languages', formData.languages);
        if (formData.hospital) formDataToSend.append('hospital', formData.hospital);
        if (formData.description) formDataToSend.append('description', formData.description);

        // Ensure registrationNumber is sent (backend requirement)
        const registrationNumber = formData.nmcRegistrationNumber || formData.registrationNumber;
        if (registrationNumber) formDataToSend.append('registrationNumber', registrationNumber);

        // Append consultation fees as JSON
        formDataToSend.append('consultationFees', JSON.stringify(formData.consultationFees));

        if (formData.nmcRegistrationNumber) formDataToSend.append('nmcRegistrationNumber', formData.nmcRegistrationNumber);
        if (formData.stateMedicalCouncil) formDataToSend.append('stateMedicalCouncil', formData.stateMedicalCouncil);
        if (formData.stateCouncilRegistrationNumber) formDataToSend.append('stateCouncilRegistrationNumber', formData.stateCouncilRegistrationNumber);
        if (formData.stateCouncilValidTill) formDataToSend.append('stateCouncilValidTill', formData.stateCouncilValidTill);

        if (formData.identityProofType) formDataToSend.append('identityProofType', formData.identityProofType);
        if (formData.identityProofNumber) formDataToSend.append('identityProofNumber', formData.identityProofNumber);
        if (formData.identityProofValidTill) formDataToSend.append('identityProofValidTill', formData.identityProofValidTill);

        if (formData.cmeIssuedAt) formDataToSend.append('cmeIssuedAt', formData.cmeIssuedAt);
        if (formData.cmeValidTill) formDataToSend.append('cmeValidTill', formData.cmeValidTill);

        // Malpractice History
        formDataToSend.append('hasMalpracticeHistory', String(formData.hasMalpracticeHistory));
        if (formData.hasMalpracticeHistory && formData.malpracticeNotes) {
            formDataToSend.append('malpracticeNotes', formData.malpracticeNotes);
        }

        // Append telemedicine consent
        formDataToSend.append('telemedicineConsent', JSON.stringify({
            accepted: formData.telemedicineConsent,
            acceptedAt: formData.telemedicineConsent ? new Date() : undefined,
        }));

        // Append Files - Only if local (not http/remote or server paths)
        const isLocalFile = (uri: string) =>
            uri && (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('data:'));

        if (formData.uniformPhoto?.uri && isLocalFile(formData.uniformPhoto.uri)) {
            formDataToSend.append('uniformPhoto', {
                uri: formData.uniformPhoto.uri,
                type: formData.uniformPhoto.type || 'image/jpeg',
                name: formData.uniformPhoto.name || 'photo.jpg',
            } as any);
        }
        if (formData.identityProofDocument?.uri && isLocalFile(formData.identityProofDocument.uri)) {
            formDataToSend.append('identityProofDocument', {
                uri: formData.identityProofDocument.uri,
                type: formData.identityProofDocument.type || 'image/jpeg',
                name: formData.identityProofDocument.name || 'id_proof.jpg',
            } as any);
        }
        if (formData.cmeCertificate?.uri && isLocalFile(formData.cmeCertificate.uri)) {
            formDataToSend.append('cmeCertificate', {
                uri: formData.cmeCertificate.uri,
                type: formData.cmeCertificate.type || 'image/jpeg',
                name: formData.cmeCertificate.name || 'cme_cert.jpg',
            } as any);
        }

        // Append certificate files and metadata
        if (formData.certificates && formData.certificates.length > 0) {
            const certMeta = formData.certificates.map(cert => ({
                type: cert.type || 'Other',
                number: cert.number || '',
                expiry: cert.expiry || ''
            }));
            formDataToSend.append('certificateDetails', JSON.stringify(certMeta));

            formData.certificates.forEach((cert, index) => {
                // Only append if it's a new file (has uri)
                if (cert.file && cert.file.uri && isLocalFile(cert.file.uri)) {
                    formDataToSend.append(`certificates`, {
                        uri: cert.file.uri,
                        type: cert.file.type || 'image/jpeg',
                        name: cert.file.name || `cert_${index}.jpg`,
                    } as any);
                } else if (cert.uri && isLocalFile(cert.uri)) {
                    formDataToSend.append(`certificates`, {
                        uri: cert.uri,
                        type: cert.type || 'image/jpeg',
                        name: cert.name || `cert_${index}.jpg`,
                    } as any);
                }
            });
        }
        return formDataToSend;
    };

    // Auto-save draft when moving between steps or optionally on specific actions
    const saveDraft = async (silent = true) => {
        if (isReadOnly) return;

        try {
            if (!silent) setLoading(true);
            const formDataToSend = prepareFormData();
            await updateDoctorDraft(formDataToSend);

            if (!silent) {
                setStatusModal({
                    visible: true,
                    status: 'success',
                    title: 'Draft Saved',
                    message: 'Your progress has been saved successfully.',
                });
            }
        } catch (error) {
            console.error('Failed to save draft:', error);
            if (!silent) {
                setStatusModal({
                    visible: true,
                    status: 'error',
                    title: 'Save Failed',
                    message: 'Could not save your draft. Please try again.',
                });
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleNext = async () => {
        // Validation for Step 1
        if (currentStep === OnboardingStep.BASIC_DETAILS) {
            const requiredFields = [];
            if (!formData.doctorType) requiredFields.push('Qualification Type');
            if (!formData.specialization) requiredFields.push('Specialization');
            // Removed generic reg number check as it's moved to Step 3
            if (requiredFields.length > 0) {
                setStatusModal({
                    visible: true,
                    status: 'warning',
                    title: 'Missing Details',
                    message: `Please complete the following fields: ${requiredFields.join(', ')}`,
                });
                return;
            }
        }

        // Validation for Step 3 (Documents)
        if (currentStep === OnboardingStep.DOCUMENTS) {
            const requiredFields = [];
            if (!formData.nmcRegistrationNumber) requiredFields.push('NMC Registration Number');
            if (!formData.identityProofType) requiredFields.push('ID Proof Type');
            if (!formData.identityProofNumber) requiredFields.push('ID Proof Number');
            if (!formData.identityProofDocument) requiredFields.push('ID Proof Document');
            if (!formData.cmeCertificate) requiredFields.push('CME Certificate');
            if (formData.hasMalpracticeHistory && !formData.malpracticeNotes) requiredFields.push('Malpractice Details');

            if (requiredFields.length > 0) {
                setStatusModal({
                    visible: true,
                    status: 'warning',
                    title: 'Missing Documents',
                    message: `Please provide the following: ${requiredFields.join(', ')}`,
                });
                return;
            }
        }

        // Validation for Step 2
        if (currentStep === OnboardingStep.CONSULTATION_FEES) {
            const isAnyServiceEnabled =
                formData.consultationFees.chat.isEnabled ||
                formData.consultationFees.voice.isEnabled ||
                formData.consultationFees.video.isEnabled;

            if (!isAnyServiceEnabled) {
                setStatusModal({
                    visible: true,
                    status: 'warning',
                    title: 'Service Required',
                    message: 'Please enable at least one consultation service (Chat, Voice, or Video) and set a fee.',
                });
                return;
            }
        }

        // Save draft silently before moving to next step
        if (currentStep < OnboardingStep.REVIEW) {
            await saveDraft(true);
            setCurrentStep(prev => prev + 1);
        }
    };
    const handleBack = () => {
        if (currentStep > OnboardingStep.BASIC_DETAILS) {
            setCurrentStep(prev => prev - 1);
        } else {
            navigation.goBack();
        }
    };

    const handleSubmit = async () => {
        if (!formData.telemedicineConsent) {
            setStatusModal({
                visible: true,
                status: 'warning',
                title: 'Consent Required',
                message: 'You must accept the Telemedicine Practice Guidelines to submit your application.',
            });
            return;
        }

        if (approvalStatus === 'pending') {
            setStatusModal({
                visible: true,
                status: 'warning',
                title: 'Under Review',
                message: 'Your profile is currently under review by our admin team.',
            });
            return;
        }

        // Show Confirmation Modal before submitting
        setStatusModal({
            visible: true,
            status: 'info',
            title: 'Submit Application?',
            message: 'Once submitted, your profile will be sent for verification. You can modify it, but significant changes may require re-verification.',
            primaryActionText: 'Submit',
            primaryAction: processSubmission,
            onCloseAction: () => setStatusModal(prev => ({ ...prev, visible: false }))
        });
    };

    const processSubmission = async () => {
        try {
            setLoading(true);
            setStatusModal(prev => ({ ...prev, visible: false }));

            // First ensure draft is up to date
            await saveDraft(true);

            // Artificial delay to ensure backend transaction and file operations complete
            // This prevents race conditions where the 'apply' endpoint calls get-profile before the save transaction commits
            await new Promise(resolve => setTimeout(resolve, 2000));


            // Now call apply
            // Even though the backend uses the saved draft, the apply-doctor route likely still validates req.body
            const finalFormData = prepareFormData();
            await applyAsDoctor(finalFormData);

            setStatusModal({
                visible: true,
                status: 'success',
                title: 'Application Submitted',
                message: 'Your doctor application has been submitted successfully. We will review it within 24-48 hours.',
                primaryActionText: 'Finish',
                onCloseAction: () => navigation.navigate('ProfileMain'),
            });
        } catch (error: any) {
            console.error(error);
            setStatusModal({
                visible: true,
                status: 'error',
                title: 'Submission Failed',
                message: error?.response?.data?.message || 'Failed to submit application. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    const openSelection = (title: string, options: string[], field: string) => {
        setSelectionModal({ visible: true, title, options, field });
    };

    const closeSelection = () => setSelectionModal(null);

    const selectOption = (value: string) => {
        if (selectionModal) {
            if (selectionModal.field === 'tempDocType') {
                setTempDoc(prev => ({ ...prev, type: value }));
            } else {
                updateField(selectionModal.field, value);
            }
            closeSelection();
        }
    };

    const openMediaPicker = (field: string) => {
        setActiveUploadField(field);
        setMediaPickerVisible(true);
    };

    const handleMediaPicked = (asset: any) => {
        if (activeUploadField) {
            const fileData = {
                uri: asset.uri,
                type: asset.mimeType || 'image/jpeg',
                name: asset.fileName || `${activeUploadField}_${Date.now()}.jpg`,
            };

            if (activeUploadField === 'certificates') {
                // Update temp doc file
                setTempDoc(prev => ({ ...prev, file: fileData }));
            } else if (activeUploadField === 'uniformPhoto' || activeUploadField === 'identityProofDocument' || activeUploadField === 'cmeCertificate') {
                updateField(activeUploadField, fileData);
            } else {
                updateField(activeUploadField, fileData);
            }
        }
        setMediaPickerVisible(false);
    };

    const launchCamera = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
            setStatusModal({
                visible: true,
                status: 'warning',
                title: 'Permission Rejected',
                message: 'Camera access is required to take photos.',
            });
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
            handleMediaPicked(result.assets[0]);
        }
    };

    const launchLibrary = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
            handleMediaPicked(result.assets[0]);
        }
    };


    // --- Render Steps ---

    // --- Render Steps ---

    const renderBasicDetailsStep = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>1. Basic Details</Text>

            {/* Uniform Photo - Upload Immediately UI */}
            <TouchableOpacity
                style={[styles.uploadBox, formData.uniformPhoto && styles.uploadBoxActive, { marginBottom: 24 }]}
                onPress={() => openMediaPicker('uniformPhoto')}
            >
                {formData.uniformPhoto ? (
                    <Check size={24} color="#2FA561" />
                ) : (
                    <Upload size={24} color="#6B7280" />
                )}
                <Text style={[styles.uploadText, formData.uniformPhoto && { color: '#2FA561' }]}>
                    {formData.uniformPhoto ? 'Profile Photo Uploaded' : 'Upload Profile Photo'}
                </Text>
                <Text style={styles.uploadSub}>
                    {formData.uniformPhoto ? formData.uniformPhoto.name : 'In Uniform (Professional)'}
                </Text>
            </TouchableOpacity>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Qualification Type</Text>
                <TouchableOpacity
                    style={styles.selectInput}
                    onPress={() => openSelection('Select Qualification', DOCTOR_TYPES, 'doctorType')}
                >
                    <Text style={[styles.selectText, !formData.doctorType && styles.placeholderText]}>
                        {formData.doctorType || 'Select Qualification'}
                    </Text>
                    <ChevronDown size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Specialization</Text>
                <TouchableOpacity
                    style={styles.selectInput}
                    onPress={() => openSelection('Select Specialization', SPECIALIZATIONS, 'specialization')}
                >
                    <Text style={[styles.selectText, !formData.specialization && styles.placeholderText]}>
                        {formData.specialization || 'Select Specialization'}
                    </Text>
                    <ChevronDown size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Experience (Years)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. 5"
                    keyboardType="numeric"
                    value={formData.experience}
                    onChangeText={t => updateField('experience', t)}
                />
            </View>


            <View style={styles.divider} />












            <View style={styles.inputGroup}>
                <Text style={styles.label}>Languages Spoken</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. English, Hindi"
                    value={formData.languages}
                    onChangeText={t => updateField('languages', t)}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Hospital/Clinic</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Apollo Hospital"
                    value={formData.hospital}
                    onChangeText={t => updateField('hospital', t)}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Description / Bio</Text>
                <TextInput
                    style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                    placeholder="Brief description for patients..."
                    multiline
                    numberOfLines={4}
                    value={formData.description}
                    onChangeText={t => updateField('description', t)}
                />
            </View>
        </View>
    );

    const addDocument = () => {
        if (!tempDoc.type || !tempDoc.file) {
            setStatusModal({
                visible: true,
                status: 'warning',
                title: 'Missing Information',
                message: 'Please select a document type and upload the file.',
            });
            return;
        }

        updateField('certificates', [...formData.certificates, { ...tempDoc }]);
        setTempDoc({ type: '', number: '', expiry: '', file: null });
        setIsAddingDoc(false);
    };

    const removeDocument = (index: number) => {
        const updated = [...formData.certificates];
        updated.splice(index, 1);
        updateField('certificates', updated);
    };

    const renderDocumentsStep = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>3. Document Uploads</Text>
            <Text style={styles.stepDesc}>Upload your professional certificates and other relevant documents.</Text>

            {/* Section 1: Registration Details */}
            <Text style={styles.sectionHeader}>Registration Details</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>NMC Registration Number *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. NMC-123456"
                    value={formData.nmcRegistrationNumber}
                    autoCapitalize="characters"
                    onChangeText={t => updateField('nmcRegistrationNumber', t)}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>State Medical Council</Text>
                <TouchableOpacity
                    style={styles.selectInput}
                    onPress={() => openSelection('Select State Council', STATE_COUNCILS, 'stateMedicalCouncil')}
                >
                    <Text style={[styles.selectText, !formData.stateMedicalCouncil && styles.placeholderText]}>
                        {formData.stateMedicalCouncil || 'Select Council'}
                    </Text>
                    <ChevronDown size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>State Reg. No.</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="State Number"
                        value={formData.stateCouncilRegistrationNumber}
                        onChangeText={t => updateField('stateCouncilRegistrationNumber', t)}
                    />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Valid Till</Text>
                    <TouchableOpacity
                        style={styles.selectInput}
                        onPress={() => openDatePicker('stateCouncilValidTill')}
                    >
                        <Text style={[styles.selectText, !formData.stateCouncilValidTill && styles.placeholderText]}>
                            {formData.stateCouncilValidTill || 'DD/MM/YYYY'}
                        </Text>
                        <Calendar size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.divider} />

            {/* Section 2: Identity Proof */}
            <Text style={styles.sectionHeader}>Identity Proof</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>ID Type *</Text>
                <TouchableOpacity
                    style={styles.selectInput}
                    onPress={() => openSelection('Select ID Type', IDENTITY_PROOF_TYPES, 'identityProofType')}
                >
                    <Text style={[styles.selectText, !formData.identityProofType && styles.placeholderText]}>
                        {formData.identityProofType || 'Select ID Type'}
                    </Text>
                    <ChevronDown size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>ID Number *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Card Number"
                        value={formData.identityProofNumber}
                        onChangeText={t => updateField('identityProofNumber', t)}
                    />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Valid Till</Text>
                    <TouchableOpacity
                        style={styles.selectInput}
                        onPress={() => openDatePicker('identityProofValidTill')}
                    >
                        <Text style={[styles.selectText, !formData.identityProofValidTill && styles.placeholderText]}>
                            {formData.identityProofValidTill || 'DD/MM/YYYY'}
                        </Text>
                        <Calendar size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.uploadBox, formData.identityProofDocument && styles.uploadBoxActive]}
                onPress={() => openMediaPicker('identityProofDocument')}
            >
                {formData.identityProofDocument ? (
                    <Check size={24} color="#2FA561" />
                ) : (
                    <Upload size={24} color="#6B7280" />
                )}
                <Text style={[styles.uploadText, formData.identityProofDocument && { color: '#2FA561' }]}>
                    {formData.identityProofDocument ? 'ID Document Uploaded' : 'Upload ID Proof *'}
                </Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Section 3: CME */}
            <Text style={styles.sectionHeader}>CME Verification</Text>

            <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Issued At</Text>
                    <TouchableOpacity
                        style={styles.selectInput}
                        onPress={() => openDatePicker('cmeIssuedAt')}
                    >
                        <Text style={[styles.selectText, !formData.cmeIssuedAt && styles.placeholderText]}>
                            {formData.cmeIssuedAt || 'DD/MM/YYYY'}
                        </Text>
                        <Calendar size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Valid Till</Text>
                    <TouchableOpacity
                        style={styles.selectInput}
                        onPress={() => openDatePicker('cmeValidTill')}
                    >
                        <Text style={[styles.selectText, !formData.cmeValidTill && styles.placeholderText]}>
                            {formData.cmeValidTill || 'DD/MM/YYYY'}
                        </Text>
                        <Calendar size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.uploadBox, formData.cmeCertificate && styles.uploadBoxActive]}
                onPress={() => openMediaPicker('cmeCertificate')}
            >
                {formData.cmeCertificate ? (
                    <Check size={24} color="#2FA561" />
                ) : (
                    <Upload size={24} color="#6B7280" />
                )}
                <Text style={[styles.uploadText, formData.cmeCertificate && { color: '#2FA561' }]}>
                    {formData.cmeCertificate ? 'CME Certificate Uploaded' : 'Upload CME Certificate *'}
                </Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Section 4: Malpractice History */}
            <Text style={styles.sectionHeader}>Malpractice History</Text>

            <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => updateField('hasMalpracticeHistory', !formData.hasMalpracticeHistory)}
            >
                <View style={[styles.checkbox, formData.hasMalpracticeHistory && styles.checkboxActive]}>
                    {formData.hasMalpracticeHistory && <Check size={16} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>
                    Have you ever been involved in a malpractice suit or had your license suspended?
                </Text>
            </TouchableOpacity>

            {formData.hasMalpracticeHistory && (
                <View style={[styles.inputGroup, { marginTop: 12 }]}>
                    <Text style={styles.label}>Please provide details *</Text>
                    <TextInput
                        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                        placeholder="Describe the incident..."
                        value={formData.malpracticeNotes}
                        onChangeText={t => updateField('malpracticeNotes', t)}
                        multiline
                    />
                </View>
            )}

            <View style={styles.divider} />

            <Text style={styles.sectionHeader}>Other Certificates (Optional)</Text>

            {/* List of Added Documents */}
            {formData.certificates.map((doc, index) => (
                <View key={index} style={styles.docCard}>
                    <View style={styles.docInfo}>
                        <Text style={styles.docType}>{doc.type || 'Certificate'}</Text>
                        <Text style={styles.docDetails}>
                            {doc.number ? `ID: ${doc.number}` : ''} {doc.expiry ? `| Exp: ${doc.expiry}` : ''}
                        </Text>
                        <Text style={styles.fileName} numberOfLines={1}>
                            {doc.file?.name || doc.name || 'File Uploaded'}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeDocument(index)} style={styles.deleteButton}>
                        <X size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            ))}

            {isAddingDoc ? (
                <View style={styles.addDocForm}>
                    <Text style={styles.formTitle}>Add New Document</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Document Type *</Text>
                        <TouchableOpacity
                            style={styles.selectInput}
                            onPress={() => openSelection('Select Document Type', CERTIFICATE_TYPES, 'tempDocType')}
                        >
                            <Text style={[styles.selectText, !tempDoc.type && styles.placeholderText]}>
                                {tempDoc.type || 'Select Type'}
                            </Text>
                            <ChevronDown size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>ID Number / Registration No.</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. ABC12345"
                            value={tempDoc.number}
                            onChangeText={t => setTempDoc(prev => ({ ...prev, number: t }))}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Expiry Date (Optional)</Text>
                        <TouchableOpacity
                            style={styles.selectInput}
                            onPress={() => openDatePicker('tempDocExpiry')}
                        >
                            <Text style={[styles.selectText, !tempDoc.expiry && styles.placeholderText]}>
                                {tempDoc.expiry || 'DD/MM/YYYY'}
                            </Text>
                            <Calendar size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.uploadBox, tempDoc.file && styles.uploadBoxActive]}
                        onPress={() => openMediaPicker('certificates')}
                    >
                        {tempDoc.file ? (
                            <Check size={24} color="#2FA561" />
                        ) : (
                            <Upload size={24} color="#6B7280" />
                        )}
                        <Text style={[styles.uploadText, tempDoc.file && { color: '#2FA561' }]}>
                            {tempDoc.file ? 'File Selected' : 'Tap to Upload File *'}
                        </Text>
                        <Text style={styles.uploadSub}>
                            {tempDoc.file ? tempDoc.file.name : '(JPG, PNG, PDF)'}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.formActions}>
                        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setIsAddingDoc(false)}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.addButton]} onPress={addDocument}>
                            <Text style={styles.addButtonText}>Add Document</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <TouchableOpacity style={styles.addNewDocButton} onPress={() => setIsAddingDoc(true)}>
                    <Text style={styles.addNewDocText}>+ Add New Document</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderFeeInput = (
        label: string,
        type: 'chat' | 'voice' | 'video',
        icon?: any
    ) => {
        const fees = formData.consultationFees[type];
        const isEnabled = fees.isEnabled;

        return (
            <View style={[styles.feeCard, isEnabled && styles.feeCardActive]}>
                <View style={styles.feeHeader}>
                    <TouchableOpacity
                        style={[styles.checkbox, isEnabled && styles.checkboxActive]}
                        onPress={() => {
                            updateField('consultationFees', {
                                ...formData.consultationFees,
                                [type]: { ...fees, isEnabled: !isEnabled }
                            });
                        }}
                    >
                        {isEnabled && <Check size={16} color="#fff" />}
                    </TouchableOpacity>
                    <Text style={styles.feeTitle}>{label}</Text>
                </View>

                {isEnabled && (
                    <View style={styles.feeInputContainer}>
                        <Text style={styles.currencyPrefix}>₹</Text>
                        <TextInput
                            style={styles.feeInput}
                            placeholder="0"
                            keyboardType="numeric"
                            value={fees.fee.toString()}
                            onChangeText={t => {
                                updateField('consultationFees', {
                                    ...formData.consultationFees,
                                    [type]: { ...fees, fee: Number(t) || 0 }
                                });
                            }}
                        />
                    </View>
                )}
            </View>
        );
    };

    const renderConsultationFeesStep = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>2. Consultation Modalities</Text>
            <Text style={styles.stepDesc}>Enable the services you wish to provide and set your fees per consultation.</Text>

            {renderFeeInput('Video Consultation', 'video')}
            {renderFeeInput('Voice Call Consultation', 'voice')}
            {renderFeeInput('Chat Consultation', 'chat')}
        </View>
    );

    const renderReviewStep = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>4. Review & Submit</Text>
            <View style={styles.reviewCard}>
                <Text style={styles.reviewLabel}>Qualification</Text>
                <Text style={styles.reviewValue}>{formData.doctorType || 'Not specified'}</Text>

                <Text style={styles.reviewLabel}>Specialization</Text>
                <Text style={styles.reviewValue}>{formData.specialization || 'Not specified'}</Text>

                <Text style={styles.reviewLabel}>Experience</Text>
                <Text style={styles.reviewValue}>{formData.experience ? `${formData.experience} years` : 'Not specified'}</Text>

                <Text style={styles.reviewLabel}>NMC Registration</Text>
                <Text style={styles.reviewValue}>{formData.nmcRegistrationNumber || 'Not specified'}</Text>

                <Text style={styles.reviewLabel}>State Council</Text>
                <Text style={styles.reviewValue}>
                    {formData.stateMedicalCouncil ? `${formData.stateMedicalCouncil} (${formData.stateCouncilRegistrationNumber})` : 'Not specified'}
                </Text>

                <Text style={styles.reviewLabel}>Identity Proof</Text>
                <Text style={styles.reviewValue}>
                    {formData.identityProofType ? `${formData.identityProofType} - ${formData.identityProofNumber}` : 'Not specified'}
                </Text>

                <Text style={styles.reviewLabel}>Malpractice History</Text>
                <Text style={[styles.reviewValue, { color: formData.hasMalpracticeHistory ? '#EF4444' : '#111827' }]}>
                    {formData.hasMalpracticeHistory ? 'Yes (See details involved)' : 'No'}
                </Text>

                <Text style={styles.reviewLabel}>Consultation Fees</Text>
                <View style={styles.reviewFeesRow}>
                    {['video', 'voice', 'chat'].map((mode) => {
                        const m = mode as keyof typeof formData.consultationFees;
                        // @ts-ignore
                        const details = formData.consultationFees[m];
                        if (typeof details === 'object' && details.isEnabled) {
                            return (
                                <View key={mode} style={styles.reviewFeeTag}>
                                    <Text style={styles.reviewFeeText}>
                                        {mode.charAt(0).toUpperCase() + mode.slice(1)}: ₹{details.fee}
                                    </Text>
                                </View>
                            );
                        }
                        return null;
                    })}
                    {(!formData.consultationFees.video.isEnabled &&
                        !formData.consultationFees.voice.isEnabled &&
                        !formData.consultationFees.chat.isEnabled) && (
                            <Text style={styles.reviewValue}>No services enabled</Text>
                        )}
                </View>
            </View>

            <Text style={styles.disclaimer}>
                By submitting, you agree that your profile will be reviewed by our team. Approval usually takes 24-48 hours.
            </Text>

            <View style={[styles.checkboxRow, { marginTop: 24 }]}>
                <TouchableOpacity
                    style={[styles.checkbox, formData.telemedicineConsent && styles.checkboxActive]}
                    onPress={() => updateField('telemedicineConsent', !formData.telemedicineConsent)}
                >
                    {formData.telemedicineConsent && <Check size={16} color="#fff" />}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>
                    I confirm that I am a registered medical practitioner in India and I agree to comply with the Telemedicine Practice Guidelines (2020).
                </Text>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: '#fff' }}
        >
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <ChevronLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {isReadOnly ? 'Doctor Profile' : 'Apply as Doctor'}
                </Text>

                <View style={{ width: 40 }} />
            </View>

            {/* Status Banners */}
            {approvalStatus === 'pending' && (
                <View style={styles.bannerPending}>
                    <Text style={styles.bannerText}>Profile under review. Editing is disabled.</Text>
                </View>
            )}
            {approvalStatus === 'rejected' && (
                <View style={styles.bannerRejected}>
                    <Text style={styles.bannerText}>Application Rejected: {rejectionReason || 'Please update your details.'}</Text>
                </View>
            )}
            {approvalStatus === 'approved' && !isReadOnly && (
                <View style={styles.bannerWarning}>
                    <Text style={styles.bannerText}>Changes will require admin approval.</Text>
                </View>
            )}

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${(currentStep / TOTAL_STEPS) * 100}%` }]} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {currentStep === OnboardingStep.BASIC_DETAILS && renderBasicDetailsStep()}
                {currentStep === OnboardingStep.CONSULTATION_FEES && renderConsultationFeesStep()}
                {currentStep === OnboardingStep.DOCUMENTS && renderDocumentsStep()}
                {currentStep === OnboardingStep.REVIEW && renderReviewStep()}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                {isReadOnly ? (
                    <View style={styles.pendingInfoContainer}>
                        <Text style={styles.pendingInfoText}>
                            Your application is currently being reviewed. You will be notified once the verification process is complete.
                        </Text>
                    </View>
                ) : (
                    currentStep === OnboardingStep.REVIEW ? (
                        <View style={styles.actionButtonRow}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.saveButton]}
                                onPress={() => saveDraft(false)}
                                disabled={loading}
                            >
                                <Text style={styles.saveButtonText}>Save Draft</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, styles.submitButton]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.nextButtonText}>Submit Application</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.nextButton}
                            onPress={handleNext}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.nextButtonText}>
                                    Next Step
                                </Text>
                            )}
                        </TouchableOpacity>
                    )
                )}
            </View>

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
                            <ScrollView style={{ maxHeight: 400 }}>
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
                title="Upload Document"
            />

            <StatusModal
                visible={statusModal.visible}
                status={statusModal.status}
                title={statusModal.title}
                message={statusModal.message}
                primaryAction={statusModal.primaryAction}
                primaryActionText={statusModal.primaryActionText}
                onClose={() => {
                    setStatusModal(prev => ({ ...prev, visible: false }));
                    if (statusModal.onCloseAction) {
                        statusModal.onCloseAction();
                    }
                }}
            />

            {showDatePicker && (
                <DateTimePicker
                    value={getDatePickerValue()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                />
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    saveDraftText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2FA561',
    },

    // Banner Styles
    bannerPending: {
        backgroundColor: '#EFF6FF',
        padding: 12,
        alignItems: 'center',
    },
    bannerRejected: {
        backgroundColor: '#FEF2F2',
        padding: 12,
        alignItems: 'center',
    },
    bannerWarning: {
        backgroundColor: '#FFFBEB',
        padding: 12,
        alignItems: 'center',
    },
    bannerText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#374151',
    },

    progressContainer: {
        height: 4,
        backgroundColor: '#E5E7EB',
        width: '100%',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#2FA561',
    },

    content: {
        padding: 24,
    },
    stepContainer: {},
    stepTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#636569ff',
        marginBottom: 12
    },
    stepDesc: {
        fontSize: 15,
        color: '#6B7280',
        marginBottom: 24,
        lineHeight: 22,
    },

    sectionHeader: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 12,
        marginBottom: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 20,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 4,
    },

    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1F2937',
    },
    selectInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    selectText: {
        fontSize: 15,
        color: '#1F2937',
    },
    placeholderText: {
        color: '#9CA3AF',
    },

    uploadBox: {
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
        marginBottom: 20,
    },
    uploadBoxActive: {
        borderColor: '#2FA561',
        backgroundColor: '#F0FDF4',
    },
    uploadText: {
        marginTop: 12,
        fontSize: 15,
        fontWeight: '600',
        color: '#4B5563',
    },
    uploadSub: {
        marginTop: 4,
        fontSize: 13,
        color: '#9CA3AF',
    },

    // Fee Cards
    feeCard: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    feeCardActive: {
        borderColor: '#2FA561',
        backgroundColor: '#F0FDF4',
    },
    feeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        backgroundColor: '#fff',
    },
    checkboxActive: {
        backgroundColor: '#2FA561',
        borderColor: '#2FA561',
    },
    feeTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    feeInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        marginLeft: 36,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    currencyPrefix: {
        fontSize: 16,
        fontWeight: '600',
        color: '#9CA3AF',
        marginRight: 8,
    },
    feeInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },

    // Review
    reviewCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    reviewLabel: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 4,
    },
    reviewValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 16,
    },
    reviewFeesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    reviewFeeTag: {
        backgroundColor: '#E5E7EB',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    reviewFeeText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#374151',
    },
    disclaimer: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
        lineHeight: 20,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    checkboxLabel: {
        flex: 1,
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },

    // Footer
    footer: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    nextButton: {
        backgroundColor: '#2FA561',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#2FA561',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    pendingInfoContainer: {
        padding: 16,
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        alignItems: 'center',
    },
    pendingInfoText: {
        color: '#1E40AF',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },

    // Action Buttons (Review Step)
    actionButtonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButton: {
        backgroundColor: '#DCFCE7', // Light green
        borderWidth: 1,
        borderColor: '#2FA561',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2FA561',
    },
    submitButton: {
        backgroundColor: '#2FA561',
        shadowColor: '#2FA561',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },

    // Modal
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
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    optionText: {
        fontSize: 16,
        color: '#374151',
    },
    selectedOptionText: {
        color: '#2FA561',
        fontWeight: '600',
    },
    selectedDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2FA561',
    },

    // Doc List Styles
    docCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    docInfo: {
        flex: 1,
    },
    docType: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    docDetails: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    fileName: {
        fontSize: 12,
        color: '#2FA561',
        marginTop: 2,
    },
    deleteButton: {
        padding: 8,
    },

    // Add Doc Form Styles
    addDocForm: {
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginTop: 8,
    },
    formTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 16,
    },
    addNewDocButton: {
        padding: 16,
        borderWidth: 1,
        borderColor: '#2FA561',
        borderStyle: 'dashed',
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        marginVertical: 12,
    },
    addNewDocText: {
        color: '#2FA561',
        fontWeight: '600',
        fontSize: 15,
    },
    formActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#374151',
        fontWeight: '600',
    },
    addButton: {
        flex: 1,
        backgroundColor: '#2FA561',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    button: {
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
});


