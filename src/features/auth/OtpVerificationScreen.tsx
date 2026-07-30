import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
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

import { bootSuccess } from '../../bootstrap/boot.slice';
import StatusModal, { StatusType } from '../../components/modals/StatusModal';
import { loginSuccess } from '../../redux/slices/authSlice';
import { sendOtp, verifyOtp } from '../../services/api/auth.api';
import { getProfileDetails } from '../../services/api/user.api';
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
            const deviceId = getDeviceId();
            const res = await verifyOtp(phone, otpString, fcmToken, deviceId);
            if (res?.access_token) {
                await setToken('access_token', res.access_token);

                let isProfileComplete = res.onboardingComplete;

                // Double check if profile exists to avoid false negatives for existing users
                if (!isProfileComplete) {
                    try {
                        const profile = await getProfileDetails();
                        if (profile && profile.name && profile.email) {
                            isProfileComplete = true;
                        }
                    } catch (e) {
                        // Profile fetch failed, assume incomplete
                    }
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

            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    backButton: {
        padding: 8,
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
        borderColor: '#2FA561',
        backgroundColor: '#F0FDF4',
    },
    continueButton: {
        backgroundColor: '#2FA561',
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
