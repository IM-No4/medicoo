import { useNavigation, useRoute } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import {
    ChevronDown,
    ChevronLeft,
    ChevronUp,
    FileText,
    FlaskConical,
    Mic, MicOff,
    MoreHorizontal,
    PenTool,
    PhoneOff,
    Pill,
    Trash2,
    Video as VideoIcon, VideoOff, Volume2, VolumeX
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated, Dimensions,
    PanResponder,
    PermissionsAndroid, Platform, ScrollView, StatusBar,
    StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import createAgoraRtcEngine, {
    ChannelProfileType,
    ClientRoleType,
    IRtcEngine,
    RtcSurfaceView
} from 'react-native-agora';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StatusModal, { StatusType } from '../../components/modals/StatusModal';
import { AGORA_APP_ID } from '../../config/agoraConfig';
import {
    fetchLabTests, fetchMedicines, fetchPatientReports,
    saveConsultationDetails, storePatientChannel
} from '../../services/api/doctor.api';

const { width, height } = Dimensions.get('window');

// --- Helper Components ---

function DropdownField({ label, options, selectedValue, onSelect, zIndex = 1, isOpen, onToggle }: any) {
    return (
        <View style={[dropdownStyles.container, { zIndex: isOpen ? 1000 : zIndex }]}>
            <TouchableOpacity style={dropdownStyles.dropdown} onPress={onToggle}>
                <Text style={dropdownStyles.dropdownText}>{selectedValue || 'Select'}</Text>
                {isOpen ? <ChevronUp size={20} color="#333" /> : <ChevronDown size={20} color="#333" />}
            </TouchableOpacity>
            {isOpen && (
                <View style={[dropdownStyles.optionsContainer, { zIndex: 1000 }]}>
                    {options.map((option: string) => (
                        <TouchableOpacity
                            key={option}
                            style={dropdownStyles.option}
                            onPress={() => {
                                onSelect(option);
                                onToggle();
                            }}
                        >
                            <Text style={dropdownStyles.optionText}>{option}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
}

const CustomBottomSheet = ({ isVisible, onClose, children, height: sheetHeightProp, sheetBgColor }: any) => {
    const sheetHeight = sheetHeightProp || height * 0.8;
    const slideAnim = useRef(new Animated.Value(sheetHeight)).current;
    const dragPan = useRef(new Animated.Value(0)).current;

    const headerPanResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    dragPan.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 50) {
                    onClose && onClose();
                } else {
                    Animated.spring(dragPan, { toValue: 0, useNativeDriver: false }).start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (isVisible) {
            dragPan.setValue(0);
            Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
        } else {
            Animated.timing(slideAnim, { toValue: sheetHeight, duration: 300, useNativeDriver: false }).start();
        }
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <View style={styles.sheetOverlay}>
            <TouchableOpacity style={styles.sheetOverlayTouchable} onPress={onClose} activeOpacity={1} />
            <Animated.View
                style={[
                    styles.bottomSheet,
                    {
                        height: sheetHeight,
                        transform: [{ translateY: Animated.add(slideAnim, dragPan) }],
                        backgroundColor: sheetBgColor ? sheetBgColor : '#fff',
                    },
                ]}
            >
                <View style={styles.sheetHeader} {...headerPanResponder.panHandlers}>
                    <View style={styles.dragIndicator} />
                </View>
                <View style={styles.sheetContent}>{children}</View>
            </Animated.View>
        </View>
    );
};

// --- Main Component ---

export default function DoctorCallScreen() {
    const insets = useSafeAreaInsets();
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { appointment, type = 'video' } = route.params || {};

    // Call State
    const [isMicOn, setIsMicOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(type === 'video');
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [duration, setDuration] = useState(0);
    const [isControlsVisible, setIsControlsVisible] = useState(true);
    const [isVoiceMode, setIsVoiceMode] = useState(type === 'voice');

    // Agora State
    const [isJoined, setIsJoined] = useState(false);
    const [remoteUid, setRemoteUid] = useState<number | null>(null);
    const engine = useRef<IRtcEngine | null>(null);

    // Feature States
    const [submenuVisible, setSubmenuVisible] = useState(false);
    const [reportsVisible, setReportsVisible] = useState(false);
    const [medicineVisible, setMedicineVisible] = useState(false);
    const [medicineDetailsVisible, setMedicineDetailsVisible] = useState(false);
    const [notesVisible, setNotesVisible] = useState(false);
    const [labTestVisible, setLabTestVisible] = useState(false);
    const [labTestDetailsVisible, setLabTestDetailsVisible] = useState(false);

    // Data States
    const [reportsData, setReportsData] = useState<any>(null);
    const [notesText, setNotesText] = useState('');

    // Medicines
    const [medicineSearch, setMedicineSearch] = useState('');
    const [medicineSuggestions, setMedicineSuggestions] = useState<any[]>([]);
    const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
    const [addedMedicines, setAddedMedicines] = useState<any[]>([]);
    const [medicineIntakeDetails, setMedicineIntakeDetails] = useState<any>({
        dosage: '', period: '', instructions: [], extra: ''
    });
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    // Lab Tests
    const [labTestSearch, setLabTestSearch] = useState('');
    const [labTestSuggestions, setLabTestSuggestions] = useState<any[]>([]);
    const [selectedLabTest, setSelectedLabTest] = useState<string | null>(null);
    const [addedLabTests, setAddedLabTests] = useState<any[]>([]);
    const [labTestAdditionalDetails, setLabTestAdditionalDetails] = useState('');

    // Status Modal State
    const [status, setStatus] = useState<{
        visible: boolean;
        type: StatusType;
        title: string;
        message: string;
        primaryAction?: () => void;
        primaryActionText?: string;
    }>({
        visible: false,
        type: 'idle',
        title: '',
        message: ''
    });

    const showStatus = (type: StatusType, title: string, message: string, primaryAction?: () => void, primaryActionText?: string) => {
        setStatus({ visible: true, type, title, message, primaryAction, primaryActionText });
    };

    const hideStatus = () => setStatus(prev => ({ ...prev, visible: false }));

    const displayName = appointment?.patientName || 'Patient Name';
    const channelId = appointment?.id || 'medicoo_test_channel';

    // Draggable Logic
    const SELF_VIEW_WIDTH = 100;
    const SELF_VIEW_HEIGHT = 140;
    const ACTION_BAR_HEIGHT = 90 + insets.bottom;
    const TOP_BAR_LIMIT = insets.top;

    const lastPosition = useRef({ x: width - SELF_VIEW_WIDTH - 16, y: height - ACTION_BAR_HEIGHT - SELF_VIEW_HEIGHT }).current;
    const pan = useRef(new Animated.ValueXY({ x: lastPosition.x, y: lastPosition.y })).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => { },
            onPanResponderMove: (e, gesture) => {
                let newX = lastPosition.x + gesture.dx;
                let newY = lastPosition.y + gesture.dy;
                newX = Math.max(0, Math.min(newX, width - SELF_VIEW_WIDTH));
                newY = Math.max(TOP_BAR_LIMIT, Math.min(newY, height - ACTION_BAR_HEIGHT - SELF_VIEW_HEIGHT));
                pan.setValue({ x: newX, y: newY });
            },
            onPanResponderRelease: (e, gesture) => {
                lastPosition.x += gesture.dx;
                lastPosition.y += gesture.dy;
                lastPosition.x = Math.max(0, Math.min(lastPosition.x, width - SELF_VIEW_WIDTH));
                lastPosition.y = Math.max(TOP_BAR_LIMIT, Math.min(lastPosition.y, height - ACTION_BAR_HEIGHT - SELF_VIEW_HEIGHT));
                pan.setValue({ x: lastPosition.x, y: lastPosition.y });
            },
        })
    ).current;

    useEffect(() => {
        setupAgora();
        const interval = setInterval(() => setDuration(prev => prev + 1), 1000);
        return () => {
            clearInterval(interval);
            leaveChannel();
        };
    }, []);

    // Search Effects
    useEffect(() => {
        if (medicineSearch.length > 0) {
            fetchMedicines(medicineSearch).then(setMedicineSuggestions).catch(console.error);
        } else {
            setMedicineSuggestions([]);
        }
    }, [medicineSearch]);

    useEffect(() => {
        if (labTestSearch.length > 0) {
            fetchLabTests(labTestSearch).then(setLabTestSuggestions).catch(console.error);
        } else {
            setLabTestSuggestions([]);
        }
    }, [labTestSearch]);

    // Reports Effect
    useEffect(() => {
        if (reportsVisible) {
            // Mock customerId from appointment or use patientId
            const customerId = appointment?.patientId || '';
            fetchPatientReports(customerId)
                .then(data => setReportsData(Array.isArray(data) ? JSON.stringify(data) : data?.message || 'No reports found.'))
                .catch(err => setReportsData('Failed to fetch reports.'));
        }
    }, [reportsVisible]);

    const requestPermissions = async () => {
        if (Platform.OS === 'android') {
            await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                PermissionsAndroid.PERMISSIONS.CAMERA,
            ]);
        }
    };

    const setupAgora = async () => {
        try {
            await requestPermissions();
            engine.current = createAgoraRtcEngine();
            engine.current.initialize({ appId: AGORA_APP_ID, channelProfile: ChannelProfileType.ChannelProfileCommunication });

            engine.current.registerEventHandler({
                onJoinChannelSuccess: () => setIsJoined(true),
                onUserJoined: (_conn, uid) => setRemoteUid(uid),
                onUserOffline: () => setRemoteUid(null),
            });

            engine.current.enableVideo();
            if (!isVoiceMode) engine.current.startPreview();

            engine.current.joinChannel('', channelId, 0, { clientRoleType: ClientRoleType.ClientRoleBroadcaster });

            // Store Channel
            storePatientChannel(appointment?.patientId, appointment?.doctorId, channelId, appointment?.id || appointment?._id).catch(console.error);

        } catch (e) { console.error('Agora Setup Error', e); }
    };

    const leaveChannel = async () => {
        try {
            engine.current?.leaveChannel();
            engine.current?.release();
            setIsJoined(false);
        } catch (e) { console.error(e); }
    };

    const handleEndCall = async () => {
        showStatus(
            'warning',
            'End Consultation?',
            'Are you sure you want to hang up? The consultation summary will be saved automatically.',
            async () => {
                try {
                    hideStatus();
                    // Save Consultation
                    const consultationData = {
                        slotId: appointment?.id || appointment?._id,
                        patientId: appointment?.patientId,
                        doctorId: appointment?.doctorId,
                        prescribedMedicines: addedMedicines.map(med => ({
                            medicineId: med.sku || med.id,
                            medicineName: med.productName || med.name,
                            intakeDetails: med.intakeDetails
                        })),
                        prescribedLabTests: addedLabTests.map(test => ({
                            testName: test.name,
                            additionalDetails: test.additionalDetails
                        })),
                        notes: notesText.split('\n').filter(n => n.trim() !== '').map(content => ({ content }))
                    };
                    await saveConsultationDetails(consultationData);
                } catch (err) { console.error('Error saving consultation', err); }

                leaveChannel();
                navigation.goBack();
            },
            'End Call'
        );
    };

    const toggleMic = () => { setIsMicOn(!isMicOn); engine.current?.muteLocalAudioStream(isMicOn); };
    const toggleVideo = () => { setIsVideoOn(!isVideoOn); engine.current?.muteLocalVideoStream(isVideoOn); };
    const toggleSpeaker = () => { setIsSpeakerOn(!isSpeakerOn); engine.current?.setEnableSpeakerphone(!isSpeakerOn); };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // --- Submenu Handlers ---
    // const productTypeFields: any = {
    //     tablets: { fields: ['count', 'frequency'], dropdowns: { count: ['1', '2'], frequency: ['Once daily', 'Twice daily'] }, labels: { count: 'Count', frequency: 'Freq' } }
    //     // ... simplified for brevity, assume similar structure logic
    // };

    const confirmMedicineDetails = () => {
        const entry = { ...selectedMedicine, intakeDetails: medicineIntakeDetails };
        setAddedMedicines([...addedMedicines, entry]);
        setMedicineDetailsVisible(false);
        setSelectedMedicine(null);
        setMedicineIntakeDetails({ dosage: '', period: '', instructions: [], extra: '' });
    };

    const confirmLabTestDetails = () => {
        if (selectedLabTest) {
            setAddedLabTests([...addedLabTests, { name: selectedLabTest, additionalDetails: labTestAdditionalDetails }]);
        }
        setLabTestDetailsVisible(false);
        setSelectedLabTest(null);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Remote Feed */}
            <TouchableOpacity
                style={styles.fullScreenVideo}
                activeOpacity={1}
                onPress={() => setSubmenuVisible(false)}
            >
                {remoteUid ? (
                    <RtcSurfaceView key={`remote-${remoteUid}`} canvas={{ uid: remoteUid }} style={styles.videoStream} />
                ) : (
                    <View style={styles.placeholderStream}>
                        <View style={styles.avatarLarge}><Text style={styles.avatarTextLarge}>{displayName.charAt(0)}</Text></View>
                        <Text style={styles.connectingText}>Waiting for connection...</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Top Bar */}
            {isControlsVisible && (
                <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
                    <View style={styles.topBarContent}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <ChevronLeft size={28} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.topDoctorName}>{displayName}</Text>
                        <BlurView intensity={20} tint="light" style={styles.timerPill}>
                            <Text style={styles.timerTextMain}>{formatTime(duration)}</Text>
                        </BlurView>
                    </View>
                </View>
            )}

            {/* Self View */}
            {isVideoOn && !isVoiceMode && (
                <Animated.View style={[styles.selfViewContainer, { transform: pan.getTranslateTransform() }]} {...panResponder.panHandlers}>
                    <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>LIVE NOW</Text></View>
                    <RtcSurfaceView key="local-feed" canvas={{ uid: 0 }} style={styles.videoStream} zOrderMediaOverlay={true} />
                </Animated.View>
            )}

            {/* Submenu */}
            {isControlsVisible && submenuVisible && (
                <View style={[styles.submenu, { bottom: ACTION_BAR_HEIGHT + 20 }]}>
                    {[
                        { label: 'View Reports', icon: <FileText size={20} color="#4B6CB7" />, onPress: () => { setReportsVisible(true); setSubmenuVisible(false); } },
                        { label: 'Prescribe Medicines', icon: <Pill size={20} color="#E74C3C" />, onPress: () => { setMedicineVisible(true); setSubmenuVisible(false); } },
                        { label: 'Prescribe Lab Test', icon: <FlaskConical size={20} color="#F1C40F" />, onPress: () => { setLabTestVisible(true); setSubmenuVisible(false); } },
                        { label: 'Write a note', icon: <PenTool size={20} color="#2ECC71" />, onPress: () => { setNotesVisible(true); setSubmenuVisible(false); } },
                    ].map((item, idx, arr) => (
                        <View key={item.label}>
                            <TouchableOpacity style={styles.submenuItem} onPress={item.onPress}>
                                {item.icon}
                                <Text style={styles.submenuText}>{item.label}</Text>
                            </TouchableOpacity>
                            {idx !== arr.length - 1 && <View style={styles.separator} />}
                        </View>
                    ))}
                </View>
            )}

            {/* Action Row */}
            {isControlsVisible && (
                <View style={styles.bottomActionContainer}>
                    {/* End Call Button - Positioned Above */}
                    <View style={styles.endCallButtonWrapper}>
                        <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
                            <PhoneOff size={28} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Action Bar */}
                    <View style={[styles.actionRowBackground, { height: 90 + insets.bottom, paddingBottom: insets.bottom }]}>

                        {/* Mic Button */}
                        <TouchableOpacity
                            style={[styles.iconCircle, isMicOn ? styles.iconActive : styles.iconInactive]}
                            onPress={toggleMic}
                        >
                            {isMicOn ? <Mic size={22} color="#2FA561" /> : <MicOff size={22} color="#fff" />}
                        </TouchableOpacity>

                        {/* Video Button */}
                        <TouchableOpacity
                            style={[styles.iconCircle, isVideoOn ? styles.iconActive : styles.iconInactive]}
                            onPress={toggleVideo}
                        >
                            {isVideoOn ? <VideoIcon size={22} color="#2FA561" /> : <VideoOff size={22} color="#fff" />}
                        </TouchableOpacity>

                        {/* Empty Space in Center */}
                        <View style={{ width: 70 }} />

                        {/* Speaker Button */}
                        <TouchableOpacity
                            style={[styles.iconCircle, isSpeakerOn ? styles.iconActive : styles.iconInactive]}
                            onPress={toggleSpeaker}
                        >
                            {isSpeakerOn ? <Volume2 size={22} color="#2FA561" /> : <VolumeX size={22} color="#fff" />}
                        </TouchableOpacity>

                        {/* Menu/Chat Button */}
                        <TouchableOpacity
                            style={[styles.iconCircle, styles.iconInactive]}
                            onPress={() => setSubmenuVisible(!submenuVisible)}
                        >
                            <MoreHorizontal size={32} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Bottom Sheets (Unchanged logic, just showing context for replace) */}
            <CustomBottomSheet isVisible={reportsVisible} onClose={() => setReportsVisible(false)} sheetBgColor="#f8f9fa">
                <Text style={[styles.sheetTitle, { color: '#4B6CB7' }]}>Patient Reports</Text>
                <ScrollView><Text style={styles.sheetText}>{reportsData || 'Loading...'}</Text></ScrollView>
            </CustomBottomSheet>

            <CustomBottomSheet isVisible={notesVisible} onClose={() => setNotesVisible(false)}>
                <Text style={[styles.sheetTitle, { color: '#2ECC71' }]}>Consultation Notes</Text>
                <TextInput style={styles.notesInput} multiline placeholder="Write notes here..." value={notesText} onChangeText={setNotesText} />
            </CustomBottomSheet>

            {/* Medicine Sheet */}
            <CustomBottomSheet isVisible={medicineVisible} onClose={() => setMedicineVisible(false)}>
                <Text style={[styles.sheetTitle, { color: '#E74C3C' }]}>Prescribe Medicine</Text>
                <TextInput style={styles.input} placeholder="Search Medicine" value={medicineSearch} onChangeText={setMedicineSearch} />
                {medicineSuggestions.length > 0 && (
                    <View style={styles.suggestionsList}>
                        {medicineSuggestions.map((m: any) => (
                            <TouchableOpacity key={m.sku || m.id} style={styles.suggestionItem} onPress={() => { setSelectedMedicine(m); setMedicineDetailsVisible(true); }}>
                                <Text>{m.productName || m.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
                <Text style={styles.subHeader}>Prescribed: {addedMedicines.length}</Text>
                <ScrollView style={{ maxHeight: 200 }}>
                    {addedMedicines.map((m, i) => (
                        <View key={i} style={styles.medicineCard}>
                            <Text style={styles.cardTitle}>{m.productName || m.name}</Text>
                            <TouchableOpacity onPress={() => setAddedMedicines(addedMedicines.filter((_, idx) => idx !== i))}><Trash2 size={16} color="red" /></TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            </CustomBottomSheet>

            <CustomBottomSheet isVisible={medicineDetailsVisible} onClose={() => setMedicineDetailsVisible(false)}>
                <Text style={styles.sheetTitle}>Intake Details for {selectedMedicine?.productName}</Text>
                <TextInput style={styles.input} placeholder="Dosage e.g. 500mg" value={medicineIntakeDetails.dosage} onChangeText={t => setMedicineIntakeDetails({ ...medicineIntakeDetails, dosage: t })} />
                <TouchableOpacity style={styles.sheetButton} onPress={confirmMedicineDetails}><Text style={styles.sheetButtonText}>Add Medicine</Text></TouchableOpacity>
            </CustomBottomSheet>

            <CustomBottomSheet isVisible={labTestVisible} onClose={() => setLabTestVisible(false)}>
                <Text style={[styles.sheetTitle, { color: '#F1C40F' }]}>Prescribe Lab Test</Text>
                <TextInput style={styles.input} placeholder="Search Lab Test" value={labTestSearch} onChangeText={setLabTestSearch} />
                {labTestSuggestions.map((t: any, i) => (
                    <TouchableOpacity key={i} style={styles.suggestionItem} onPress={() => { setSelectedLabTest(t.name); setLabTestDetailsVisible(true); }}>
                        <Text>{t.name}</Text>
                    </TouchableOpacity>
                ))}
                <Text style={styles.subHeader}>Ordered Tests: {addedLabTests.length}</Text>
                {addedLabTests.map((t, i) => <Text key={i}>{t.name}</Text>)}
            </CustomBottomSheet>

            <CustomBottomSheet isVisible={labTestDetailsVisible} onClose={() => setLabTestDetailsVisible(false)}>
                <Text style={styles.sheetTitle}>Details for {selectedLabTest}</Text>
                <TextInput style={styles.input} placeholder="Additional Details" value={labTestAdditionalDetails} onChangeText={setLabTestAdditionalDetails} />
                <TouchableOpacity style={styles.sheetButton} onPress={confirmLabTestDetails}><Text style={styles.sheetButtonText}>Confirm</Text></TouchableOpacity>
            </CustomBottomSheet>

            {/* Status Modal */}
            <StatusModal
                visible={status.visible}
                status={status.type}
                title={status.title}
                message={status.message}
                onClose={hideStatus}
                primaryAction={status.primaryAction}
                primaryActionText={status.primaryActionText}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    fullScreenVideo: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
    videoStream: { width: '100%', height: '100%' },
    placeholderStream: { width: '100%', height: '100%', backgroundColor: '#1F2937', alignItems: 'center', justifyContent: 'center' },
    avatarLarge: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    avatarTextLarge: { fontSize: 40, color: '#9CA3AF', fontWeight: '700' },
    connectingText: { color: '#9CA3AF', fontSize: 16, fontWeight: '500' },
    topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
    topBarContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    topDoctorName: { color: '#fff', fontSize: 18, fontWeight: '700' },
    timerPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, overflow: 'hidden' },
    timerTextMain: { color: '#fff', fontSize: 14, fontWeight: '600' },
    selfViewContainer: { position: 'absolute', width: 100, height: 140, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', zIndex: 50 },
    liveBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(47, 165, 97, 0.9)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, zIndex: 60 },
    liveBadgeText: { color: '#fff', fontSize: 8, fontWeight: '900' },

    // Updated Bottom Bar Styles - End Call Button Positioned Above
    bottomActionContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        alignItems: 'center',
    },
    endCallButtonWrapper: {
        position: 'absolute',
        bottom: 64, // Positioned above the action bar
        alignSelf: 'center',
        zIndex: 101,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    endCallButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#fff',
    },
    actionRowBackground: {
        flexDirection: 'row',
        backgroundColor: '#2FA561',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        paddingHorizontal: 10,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconActive: {
        backgroundColor: '#fff',
    },
    iconInactive: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },

    // Submenu & Sheets
    submenu: { position: 'absolute', right: 20, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 8, elevation: 10, width: 200, zIndex: 200 },
    submenuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
    submenuText: { fontSize: 15, color: '#333', fontWeight: '500' },
    separator: { height: 1, backgroundColor: '#eee', marginHorizontal: 10 },
    sheetOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, top: 0, zIndex: 300, justifyContent: 'flex-end' },
    sheetOverlayTouchable: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
    bottomSheet: { borderTopRightRadius: 24, borderTopLeftRadius: 24, padding: 20, elevation: 20 },
    sheetHeader: { height: 30, alignItems: 'center', justifyContent: 'center' },
    dragIndicator: { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2 },
    sheetContent: { flex: 1 },
    sheetTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, color: '#333' },
    sheetText: { fontSize: 16, color: '#555', lineHeight: 24 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12, backgroundColor: '#fff' },
    notesInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 14, fontSize: 16, backgroundColor: '#fff', textAlignVertical: 'top' },
    sheetButton: { backgroundColor: '#2FA561', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 },
    sheetButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    suggestionItem: { padding: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    suggestionsList: { maxHeight: 150, borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 12 },
    subHeader: { fontSize: 16, fontWeight: '600', color: '#666', marginTop: 16, marginBottom: 8 },
    medicineCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: '#fff', borderRadius: 8, marginBottom: 8, elevation: 1 },
    cardTitle: { fontSize: 16, fontWeight: '500', color: '#333' }
});

const dropdownStyles = StyleSheet.create({
    container: { position: 'relative', marginBottom: 12 },
    dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 14, backgroundColor: '#fff' },
    dropdownText: { fontSize: 16, color: '#333' },
    optionsContainer: { position: 'absolute', top: '100%', left: 0, right: 0, borderWidth: 1, borderColor: '#ddd', borderRadius: 12, marginTop: 4, backgroundColor: '#fff', elevation: 5 },
    option: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    optionText: { fontSize: 16, color: '#333' }
});