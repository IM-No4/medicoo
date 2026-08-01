import { useNavigation, useRoute } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import {
    ChevronLeft,
    Mic, MicOff,
    MoreHorizontal,
    PhoneOff,
    Video as VideoIcon, VideoOff, Volume2, VolumeX
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated, Dimensions,
    PanResponder,
    PermissionsAndroid, Platform, StatusBar,
    StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import createAgoraRtcEngine, {
    ChannelProfileType,
    ClientRoleType,
    ConnectionStateType,
    IRtcEngine,
    RtcSurfaceView
} from 'react-native-agora';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StatusModal, { StatusType } from '../../components/modals/StatusModal';
import { completeAppointmentRequest, ConsultationDetailsInput, getCallToken } from '../../services/api/doctor.api';
import ConsultationDetailsModal, { ConsultationDraft } from './components/ConsultationDetailsModal';
import InCallToolsSheet from './components/InCallToolsSheet';
import PatientReportsModal from './components/PatientReportsModal';

const EMPTY_DRAFT: ConsultationDraft = { notes: '', prescribedMedicines: [], prescribedLabTests: [] };

const { width, height } = Dimensions.get('window');

// --- Main Component ---

export default function DoctorCallScreen() {
    const insets = useSafeAreaInsets();
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { appointment, type = 'video', displayName: displayNameParam } = route.params || {};

    // Call State
    const [isMicOn, setIsMicOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(type === 'video');
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [duration, setDuration] = useState(0);
    const [isControlsVisible, setIsControlsVisible] = useState(true);
    const [isVoiceMode] = useState(type === 'voice');

    // Agora State
    const [isJoined, setIsJoined] = useState(false);
    const [remoteUid, setRemoteUid] = useState<number | null>(null);
    const [joinError, setJoinError] = useState<string | null>(null);
    // Reconnecting is a transient state the SDK recovers from on its own
    // (brief wifi hiccups etc) - Failed only fires after ~20 minutes of
    // failed auto-retry, at which point the SDK gives up and a manual rejoin
    // is the only way back in.
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [connectionFailed, setConnectionFailed] = useState(false);
    const engine = useRef<IRtcEngine | null>(null);

    const [showCompleteModal, setShowCompleteModal] = useState(false);

    // In-call doctor tools: notes/prescription/lab-test are staged locally
    // while the call is active (no backend write yet) and carried forward as
    // the starting point for the same form at the end-of-call "Complete
    // Consultation" step - see ConsultationDetailsModal's 'draft' mode.
    const [showToolsSheet, setShowToolsSheet] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [showReportsModal, setShowReportsModal] = useState(false);
    const [consultationDraft, setConsultationDraft] = useState<ConsultationDraft>(EMPTY_DRAFT);

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

    const displayName = displayNameParam || appointment?.patientDetails?.name || appointment?.doctorDetails?.name
        || appointment?.actionMeta?.patientName || 'Consultation';

    // appointment.doctorDetails is only ever populated on the patient-facing
    // detail fetch (the "other party" info) - its presence is what tells us
    // which role is viewing this shared screen.
    const isPatientViewing = !!appointment?.doctorDetails;

    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 15000);
        return () => clearInterval(interval);
    }, []);

    const noShowMinutesLeft = appointment?.noShowCutoffAt
        ? Math.max(0, Math.ceil((new Date(appointment.noShowCutoffAt).getTime() - now) / 60000))
        : null;

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

    // requestMultiple() only awaits the dialog closing - it does NOT mean the
    // permissions were granted. If the user denies (or previously denied with
    // "don't ask again"), the promise still resolves and the caller must check
    // the per-permission result, otherwise the Agora engine is told to start
    // video/audio it doesn't actually have access to and the feed just never
    // appears with no indication why.
    const requestPermissions = async (): Promise<boolean> => {
        if (Platform.OS !== 'android') return true;

        const permissions = isVoiceMode
            ? [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO]
            : [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, PermissionsAndroid.PERMISSIONS.CAMERA];

        const results = await PermissionsAndroid.requestMultiple(permissions);
        return permissions.every((permission) => results[permission] === PermissionsAndroid.RESULTS.GRANTED);
    };

    const setupAgora = async () => {
        try {
            if (!appointment?.requestId) {
                setJoinError('This consultation could not be identified.');
                return;
            }

            const { appId, channelName, token, uid } = await getCallToken(appointment.requestId);

            const permissionsGranted = await requestPermissions();
            if (!permissionsGranted) {
                setJoinError(
                    isVoiceMode
                        ? 'Microphone access is required for this call. Please enable it in your device settings and try again.'
                        : 'Camera and microphone access are required for this call. Please enable them in your device settings and try again.'
                );
                return;
            }

            engine.current = createAgoraRtcEngine();
            engine.current.initialize({ appId, channelProfile: ChannelProfileType.ChannelProfileCommunication });

            engine.current.registerEventHandler({
                onJoinChannelSuccess: () => { setIsJoined(true); setConnectionFailed(false); },
                onUserJoined: (_conn, remoteJoinedUid) => setRemoteUid(remoteJoinedUid),
                onUserOffline: () => setRemoteUid(null),
                onConnectionStateChanged: (_conn, state) => {
                    if (state === ConnectionStateType.ConnectionStateReconnecting) {
                        setIsReconnecting(true);
                    } else if (state === ConnectionStateType.ConnectionStateConnected) {
                        setIsReconnecting(false);
                        setConnectionFailed(false);
                    } else if (state === ConnectionStateType.ConnectionStateFailed) {
                        setIsReconnecting(false);
                        setConnectionFailed(true);
                    }
                },
            });

            engine.current.enableVideo();
            if (!isVoiceMode) engine.current.startPreview();

            engine.current.joinChannel(token, channelName, uid, { clientRoleType: ClientRoleType.ClientRoleBroadcaster });
        } catch (e: any) {
            console.error('Agora Setup Error', e);
            setJoinError(e?.response?.data?.message || 'Could not connect to the call. Please try again.');
        }
    };

    const leaveChannel = async () => {
        try {
            engine.current?.leaveChannel();
            engine.current?.release();
            setIsJoined(false);
        } catch (e) { console.error(e); }
    };

    const handleRetryConnection = async () => {
        setConnectionFailed(false);
        setJoinError(null);
        setRemoteUid(null);
        await leaveChannel();
        await setupAgora();
    };

    const handleEndCall = () => {
        showStatus(
            'warning',
            'End Consultation?',
            'Are you sure you want to hang up?',
            () => {
                hideStatus();
                leaveChannel();
                // Only the doctor completes the consultation - the patient
                // just leaves the call. isPatientViewing is inferred from
                // whether the shared appointment payload carries the "other
                // party" doctorDetails block (see comment above its
                // declaration).
                if (!isPatientViewing && appointment?.requestId) {
                    setShowCompleteModal(true);
                } else {
                    navigation.goBack();
                }
            },
            'End Call'
        );
    };

    const handleCompleteConsultation = async (details: ConsultationDetailsInput) => {
        setShowCompleteModal(false);
        if (!appointment?.requestId) {
            navigation.goBack();
            return;
        }
        try {
            await completeAppointmentRequest(appointment.requestId, details);
            navigation.goBack();
        } catch (error: any) {
            showStatus(
                'error',
                'Could Not Complete',
                error?.response?.data?.message || 'The call ended, but we could not save this yet. You can complete it from the appointment details screen.',
                () => { hideStatus(); navigation.goBack(); },
                'OK'
            );
        }
    };

    const toggleMic = () => { setIsMicOn(!isMicOn); engine.current?.muteLocalAudioStream(isMicOn); };
    const toggleVideo = () => { setIsVideoOn(!isVideoOn); engine.current?.muteLocalVideoStream(isVideoOn); };
    const toggleSpeaker = () => { setIsSpeakerOn(!isSpeakerOn); engine.current?.setEnableSpeakerphone(!isSpeakerOn); };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Remote Feed */}
            <View style={styles.fullScreenVideo}>
                {remoteUid ? (
                    <RtcSurfaceView key={`remote-${remoteUid}`} canvas={{ uid: remoteUid }} style={styles.videoStream} />
                ) : (
                    <View style={[styles.placeholderStream, { paddingBottom: ACTION_BAR_HEIGHT }]}>
                        <View style={styles.avatarLarge}><Text style={styles.avatarTextLarge}>{displayName.charAt(0)}</Text></View>
                        <Text style={styles.connectingText}>
                            {joinError || (isJoined ? `Waiting for ${displayName} to join...` : 'Connecting...')}
                        </Text>
                        {isJoined && !joinError && noShowMinutesLeft !== null && (
                            <Text style={styles.noShowNotice}>
                                {noShowMinutesLeft > 0
                                    ? (isPatientViewing
                                        ? `If ${displayName} doesn't join within ${noShowMinutesLeft} min, you'll be automatically refunded.`
                                        : `If ${displayName} doesn't join within ${noShowMinutesLeft} min, the consultation fee will be retained.`)
                                    : 'The check-in window is closing - this consultation will be resolved automatically shortly.'}
                            </Text>
                        )}
                    </View>
                )}
            </View>

            {/* Connection Lost Overlay - the SDK gives up auto-retrying after
                ~20 min, so from here on the user needs a manual rejoin. */}
            {connectionFailed && (
                <View style={styles.connectionLostOverlay}>
                    <View style={styles.avatarLarge}><Text style={styles.avatarTextLarge}>{displayName.charAt(0)}</Text></View>
                    <Text style={styles.connectionLostTitle}>Connection Lost</Text>
                    <Text style={styles.connectionLostText}>We couldn't reconnect you to the call. Check your network and try again.</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={handleRetryConnection}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Reconnecting Banner - shown over whatever is already on screen
                (frozen remote frame or the placeholder) while the SDK tries
                to recover on its own. */}
            {isReconnecting && !connectionFailed && (
                <View style={[styles.reconnectingBanner, { top: insets.top + 70 }]}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.reconnectingText}>Reconnecting...</Text>
                </View>
            )}

            {/* Top Bar */}
            {isControlsVisible && (
                <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
                    <View style={styles.topBarContent}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <ChevronLeft size={28} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.topDoctorName}>{displayName}</Text>
                        <View style={styles.topBarRight}>
                            <BlurView intensity={20} tint="light" style={styles.timerPill}>
                                <Text style={styles.timerTextMain}>{formatTime(duration)}</Text>
                            </BlurView>
                            {!isPatientViewing && (
                                <TouchableOpacity style={styles.toolsButton} onPress={() => setShowToolsSheet(true)}>
                                    <MoreHorizontal size={22} color="#fff" />
                                </TouchableOpacity>
                            )}
                        </View>
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
                        {!isVoiceMode && (
                            <TouchableOpacity
                                style={[styles.iconCircle, isVideoOn ? styles.iconActive : styles.iconInactive]}
                                onPress={toggleVideo}
                            >
                                {isVideoOn ? <VideoIcon size={22} color="#2FA561" /> : <VideoOff size={22} color="#fff" />}
                            </TouchableOpacity>
                        )}

                        {/* Speaker Button */}
                        <TouchableOpacity
                            style={[styles.iconCircle, isSpeakerOn ? styles.iconActive : styles.iconInactive]}
                            onPress={toggleSpeaker}
                        >
                            {isSpeakerOn ? <Volume2 size={22} color="#2FA561" /> : <VolumeX size={22} color="#fff" />}
                        </TouchableOpacity>
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
                primaryAction={status.primaryAction}
                primaryActionText={status.primaryActionText}
            />

            <ConsultationDetailsModal
                visible={showCompleteModal}
                onClose={() => { setShowCompleteModal(false); navigation.goBack(); }}
                onSubmit={handleCompleteConsultation}
                initialData={consultationDraft}
            />

            <InCallToolsSheet
                visible={showToolsSheet}
                onClose={() => setShowToolsSheet(false)}
                onOpenNotes={() => { setShowToolsSheet(false); setShowNotesModal(true); }}
                onOpenReports={() => { setShowToolsSheet(false); setShowReportsModal(true); }}
            />

            <ConsultationDetailsModal
                visible={showNotesModal}
                mode="draft"
                onClose={() => setShowNotesModal(false)}
                onSubmit={async () => { }}
                initialData={consultationDraft}
                onSaveDraft={setConsultationDraft}
            />

            <PatientReportsModal
                visible={showReportsModal}
                onClose={() => setShowReportsModal(false)}
                customerId={appointment?.customerId}
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
    connectingText: { color: '#9CA3AF', fontSize: 16, fontWeight: '500', paddingHorizontal: 32, textAlign: 'center' },
    noShowNotice: { color: '#6B7280', fontSize: 13, fontWeight: '500', paddingHorizontal: 40, textAlign: 'center', marginTop: 12, lineHeight: 18 },
    connectionLostOverlay: {
        position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 40,
        backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32,
    },
    connectionLostTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 4 },
    connectionLostText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    retryButton: { backgroundColor: '#2FA561', borderRadius: 24, paddingHorizontal: 28, paddingVertical: 12, marginTop: 20 },
    retryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    reconnectingBanner: {
        position: 'absolute', alignSelf: 'center', zIndex: 45,
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    },
    reconnectingText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
    topBarContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    topDoctorName: { color: '#fff', fontSize: 18, fontWeight: '700' },
    timerPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, overflow: 'hidden' },
    timerTextMain: { color: '#fff', fontSize: 14, fontWeight: '600' },
    topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    toolsButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    selfViewContainer: { position: 'absolute', width: 100, height: 140, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', zIndex: 50 },
    liveBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(47, 165, 97, 0.9)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, zIndex: 60 },
    liveBadgeText: { color: '#fff', fontSize: 8, fontWeight: '900' },

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
        bottom: 64,
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
});
