import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { bootSuccess } from '../../bootstrap/boot.slice';
import StatusModal, { StatusType } from '../../components/modals/StatusModal';
import { loginSuccess } from '../../redux/slices/authSlice';
import { sendOtp, verifyOtp } from '../../services/api/auth.api';
import { getDeviceId, getFCMToken } from '../../utils/deviceUtils';
import { setToken } from '../../utils/tokenManagement';

type RouteParams = {
    params: {
        phone: string;
    };
};

export default function OtpVerificationScreen() {
    const dispatch = useDispatch();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const route = useRoute<RouteProp<RouteParams, 'params'>>();
    const { phone } = route.params;

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const inputs = React.useRef<Array<TextInput | null>>([]);
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(15);
    const [statusModal, setStatusModal] = useState<{
        visible: boolean;
        status: StatusType;
        title?: string;
        message?: string;
    }>({
        visible: false,
        status: 'idle',
    });

    React.useEffect(() => {
        if (timeLeft === 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const handleVerifyOtp = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) return;
        setLoading(true);
        try {
            const fcmToken = await getFCMToken();
            const deviceId = await getDeviceId();
            const res = await verifyOtp(phone, otpString, fcmToken ?? undefined, deviceId);
            if (res?.access_token) {
                await setToken('access_token', res.access_token);

                // The backend now derives this from the actual onboarding-specific
                // profile fields (gender/dob/height/weight/bloodGroup), so it's
                // authoritative - no client-side re-check needed, and none of the
                // "response was slow so assume incomplete" guessing that used to
                // wrongly send already-onboarded users back through the form.
                const isProfileComplete = Boolean(res.onboardingComplete);
                if (isProfileComplete) {
                    await AsyncStorage.setItem('onboarding_completed', 'true');
                }

                dispatch(loginSuccess({ token: res.access_token, onboardingComplete: isProfileComplete, mobile: phone }));
                dispatch(bootSuccess({ isAuthenticated: true, onboardingCompleted: isProfileComplete }));
            }
        } catch (error: any) {
            if (error?.response?.status === 400) {
                setStatusModal({
                    visible: true,
                    status: 'error',
                    title: 'OTP Expired',
                    message: 'The OTP has expired. Please request a new one.',
                });
            } else {
                setStatusModal({
                    visible: true,
                    status: 'error',
                    title: 'Error',
                    message: 'Failed to verify OTP. Please try again.',
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            inputs.current[index + 1]?.focus();
        }

        if (newOtp.every(digit => digit !== '') && index === 5) {
            // Optional: Auto submit or just dismiss keyboard
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handleResendOtp = async () => {
        setLoading(true);
        try {
            await sendOtp(phone);
            setStatusModal({
                visible: true,
                status: 'success',
                title: 'OTP Sent',
                message: 'A new OTP has been sent to your mobile number.',
            });
            setOtp(['', '', '', '', '', '']);
            setTimeLeft(15);
            inputs.current[0]?.focus();
        } catch (error) {
            setStatusModal({
                visible: true,
                status: 'error',
                title: 'Error',
                message: 'Failed to send OTP. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color="#111827" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.contentContainer}>
                        <Text style={styles.otpTitle}>Verify Phone</Text>
                        <Text style={styles.otpSubtitle}>Code is sent to +91 {phone}</Text>

                        <View style={styles.otpContainer}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={ref => { inputs.current[index] = ref; }}
                                    style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    value={digit}
                                    onChangeText={(value) => handleOtpChange(value, index)}
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    autoFocus={index === 0}
                                />
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.continueButton, (otp.join('').length !== 6 || loading) && styles.disabledButton]}
                            onPress={handleVerifyOtp}
                            disabled={otp.join('').length !== 6 || loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.continueButtonText}>Verify OTP</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.resendContainer}>
                            <Text style={styles.resendText}>Didn't receive code? </Text>
                            <TouchableOpacity onPress={handleResendOtp} disabled={loading || timeLeft > 0}>
                                <Text style={[styles.resendLink, timeLeft > 0 && styles.disabledLink]}>
                                    {timeLeft > 0 ? `Request again in ${timeLeft}s` : 'Request again'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <StatusModal
                visible={statusModal.visible}
                status={statusModal.status}
                title={statusModal.title}
                message={statusModal.message}
                onClose={() => setStatusModal(prev => ({ ...prev, visible: false }))}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
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
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
        alignItems: 'center',
    },
    otpTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    otpSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 40,
        textAlign: 'center',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 30,
        gap: 8,
    },
    otpBox: {
        width: 45,
        height: 50,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
        backgroundColor: '#fff',
        color: '#111827',
    },
    otpBoxFilled: {
        borderColor: '#0FBBA1',
        backgroundColor: '#F0FDF4',
    },
    continueButton: {
        backgroundColor: '#0FBBA1',
        borderRadius: 8,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginBottom: 24,
    },
    disabledButton: {
        backgroundColor: '#A3D9B5',
        opacity: 0.8,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    resendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    resendText: {
        fontSize: 14,
        color: '#6B7280',
    },
    resendLink: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    disabledLink: {
        color: '#9CA3AF',
    },
});
