import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes
} from '@react-native-google-signin/google-signin';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import { bootSuccess } from '../../bootstrap/boot.slice';
import { loginSuccess } from '../../redux/slices/authSlice';
import { googleLogin, sendOtp } from '../../services/api/auth.api';
import { getDeviceId, getFCMToken } from '../../utils/deviceUtils';
import { setToken } from '../../utils/tokenManagement';

const BG_IMAGE = require('../../assets/images/login-screen-bg.png');
const GOOGLE_ICON = require('../../assets/icons/google-logo.png'); // Removed to prevent crash

// heroContainer used to size itself as '38%' of the screen, which only
// works when its parent is the full-height root View. Now that it lives
// inside the ScrollView (so it scrolls with everything else instead of
// staying pinned), it needs a fixed pixel height instead - percentages
// inside a ScrollView's content resolve against the content's own
// (content-driven) size, not the screen.
const HERO_HEIGHT = Dimensions.get('window').height * 0.38;

export default function LoginScreen() {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const [phone, setPhone] = useState('');
  // const [otp, setOtp] = useState(''); // Moved to OtpVerificationScreen
  // const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);

  // KeyboardAvoidingView's Android "height" behavior doesn't reliably
  // reset back to its original size once the keyboard hides, leaving a
  // stuck gap below termsContainer - tracking the keyboard's real height
  // manually and applying it as marginBottom resets deterministically
  // instead (same fix already applied to LiveChatScreen/OrderSupportScreen).
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  React.useEffect(() => {
    GoogleSignin.configure({
      webClientId: '933505098440-l3h5bg7s9p61dudan6ujpt0ndo4k7uma.apps.googleusercontent.com',
      offlineAccess: false,
    });
  }, []);

  const handleSendOtp = async () => {
    if (phone.length !== 10) return;
    setLoading(true);
    try {
      await sendOtp(phone);
      // setStep('OTP');
      navigation.navigate('OtpVerification', { phone });
    } finally {
      setLoading(false);
    }
  };

  // handleVerifyOtp removed - moved to new screen

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const { idToken } = userInfo.data || {};
      if (idToken) {
        const fcmToken = await getFCMToken();
        const deviceId = await getDeviceId();
        const res = await googleLogin(idToken, fcmToken ?? undefined, deviceId);
        if (res?.access_token) {
          await setToken('access_token', res.access_token);

          const isProfileComplete = Boolean(res.onboardingComplete);
          if (isProfileComplete) {
            await AsyncStorage.setItem('onboarding_completed', 'true');
          }

          dispatch(loginSuccess({ token: res.access_token, onboardingComplete: isProfileComplete }));
          dispatch(bootSuccess({ isAuthenticated: true, onboardingCompleted: isProfileComplete }));
        }
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            break;
          case statusCodes.IN_PROGRESS:
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            break;
          default:
            console.error('Google Sign-In Error', error);
        }
      } else {
        console.error('Google Sign-In Error (General)', error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={[styles.keyboardView, { marginBottom: keyboardHeight > 0 ? keyboardHeight + insets.bottom : 0 }]}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
          {/* Hero Image Section - part of the scrollable content now, so it
              moves with everything else instead of staying pinned when the
              keyboard opens. */}
          <View style={styles.heroContainer}>
            <Image source={BG_IMAGE} style={styles.heroImage} resizeMode="cover" />
            <LinearGradient
              colors={['rgba(0,0,0,0.6)', 'transparent']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 0.4 }}
            />
          </View>

          <View style={styles.contentContainer}>

            {/* OTP Back button removed */}

            <Text style={styles.mainTitle}>
              India's #1 Healthcare{'\n'}and Pharmacy App
            </Text>

            <View style={styles.dividerContainer}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>Log in or sign up</Text>
              <View style={styles.line} />
            </View>


            <>
              <View style={styles.inputRow}>
                <View style={styles.countrySelector}>
                  <Text style={styles.flag}>🇮🇳</Text>
                  <View style={styles.triangle} />
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="+91 Enter Phone Number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={10}
                />
              </View>

              <TouchableOpacity
                style={[styles.continueButton, (phone.length !== 10 || loading) && styles.disabledButton]}
                onPress={handleSendOtp}
                disabled={phone.length !== 10 || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.continueButtonText}>Continue</Text>
                )}
              </TouchableOpacity>

              <View style={styles.whatsappNotice}>
                <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                <Text style={styles.whatsappNoticeText}>
                  We'll send your OTP via WhatsApp
                </Text>
              </View>

              {/* Hidden for now as per request
                <View style={styles.orDividerContainer}>
                  <View style={styles.line} />
                  <Text style={styles.orText}>or</Text>
                  <View style={styles.line} />
                </View>

                <View style={styles.socialRow}>
                  <TouchableOpacity
                    style={styles.googleButton}
                    onPress={handleGoogleLogin}
                  >
                    <Image source={GOOGLE_ICON} style={styles.googleIcon} />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </TouchableOpacity>
                </View>
                */}


            </>

          </View>
        </ScrollView>

        <View style={[styles.termsContainer, { paddingBottom: insets.bottom + 10, paddingHorizontal: 24, backgroundColor: '#fff' }]}>
          <Text style={styles.termsText}>
            By continuing, you agree to our{'\n'}
            <Text onPress={() => navigation.navigate('TermsOfService')} style={styles.termLink}>Terms of Service</Text>  <Text onPress={() => navigation.navigate('PrivacyPolicy')} style={styles.termLink}>Privacy Policy</Text>  <Text onPress={() => navigation.navigate('ContentPolicy')} style={styles.termLink}>Content Policy</Text>
          </Text>
        </View>
      </View>
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  heroContainer: {
    height: HERO_HEIGHT,
    width: '100%',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
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
    paddingTop: 24,
    backgroundColor: '#fff',
    marginTop: -20, // Overlap slightly if we want rounded top card look, but design looks like separate sections
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  backButton: {
    marginBottom: 10,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1C1C1C',
    marginBottom: 12,
    marginTop: 12,
    lineHeight: 34,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
    backgroundColor: '#fff',
  },
  flag: {
    fontSize: 20,
    marginRight: 4,
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#374151',
    marginTop: 2,
  },
  phoneInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  continueButton: {
    backgroundColor: '#0FBBA1', // Medicoo Teal
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
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
  whatsappNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: -12,
    marginBottom: 24,
  },
  whatsappNoticeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  orDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  orText: {
    marginHorizontal: 10,
    fontSize: 14,
    color: '#6B7280',
  },
  socialRow: {
    marginBottom: 40,
    width: '100%',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    height: 50,
    width: '100%',
    gap: 12,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  termsContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  termsText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  termLink: {
    color: '#374151',
    textDecorationLine: 'underline', // Dotted underline in design? regular underline here
    textDecorationStyle: 'dotted'
  },
  // OTP Styles
  otpSection: {
    alignItems: 'center',
    paddingTop: 20,
  },
  otpTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  otpSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  otpInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 8,
  },
});
