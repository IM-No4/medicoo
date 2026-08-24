import { LinearGradient } from 'expo-linear-gradient';
import * as NavigationBar from 'expo-navigation-bar';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Full-width white card (rounded bottom corners only) over a full-bleed
// brand gradient background - the gradient shows through the rounded
// corner notches at the base of the white card, and fills the section
// below it where the dots/button sit. Same brand gradient used elsewhere
// in the app (HealthProfileScreen's header, the splash screen).
const GRADIENT_COLORS = ['#0FBBA1', '#007C69'] as const;

const slides = [
  {
    id: 1,
    title: 'Book Doctors Instantly',
    description: 'Connect with verified doctors anytime, anywhere. Get instant consultations via chat, voice, or video call.',
    illustration: require('../../assets/images/doctor-consultation.png'),
  },
  {
    id: 2,
    title: 'Order Medicines Easily',
    description: 'Browse thousands of medicines and healthcare products. Get them delivered to your doorstep quickly.',
    illustration: require('../../assets/images/medicine-delivery.png'),
  },
  {
    id: 3,
    title: 'Manage Your Health',
    description: 'Track appointments, medications, and health records all in one place. Your health, simplified.',
    illustration: require('../../assets/images/health-tracking.png'),
  },
];

export default function IntroScreen({ onFinish }: { onFinish: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const insets = useSafeAreaInsets();

  // This screen's gradient reaches the transparent system nav bar, so its
  // default dark icons (set app-wide in useSystemUI.ts, for the mostly
  // white-background rest of the app) would be nearly invisible here -
  // switch to light icons while this screen is up, and restore dark on
  // the way out.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    NavigationBar.setButtonStyleAsync('light');
    return () => {
      NavigationBar.setButtonStyleAsync('dark');
    };
  }, []);

  const handleNext = () => {
    if (currentIndex === slides.length - 1) {
      onFinish();
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const currentSlide = slides[currentIndex];
  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={GRADIENT_COLORS}
        start={Platform.select({ ios: { x: 0, y: 0 }, android: { x: 0.2, y: 0 } })}
        end={Platform.select({ ios: { x: 1, y: 0.9 }, android: { x: 0.8, y: 1 } })}
        style={StyleSheet.absoluteFill}
      />

      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Top white card - illustration lives here, on its own natural
          white background, instead of on the colored gradient where its
          opaque white edges would show through as a mismatched shape. */}
      <View style={[styles.topCard, { paddingTop: insets.top + 16 }]}>
        <View style={styles.skipRow}>
          <TouchableOpacity onPress={onFinish} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentGroup}>
          <View style={styles.illustrationWrapper}>
            <Image
              source={currentSlide.illustration}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>{currentSlide.title}</Text>
          <Text style={styles.description}>{currentSlide.description}</Text>
        </View>
      </View>

      {/* Bottom section - transparent, the gradient behind shows through
          here and in the notches left by the card's rounded corners. */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 36 }]}>
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={handleNext}
          style={styles.continueButton}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            {isLastSlide ? 'Get Started' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topCard: {
    flex: 1.4,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 44,
    borderBottomRightRadius: 44,
    alignItems: 'center',
    paddingHorizontal: 36,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  contentGroup: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  illustrationWrapper: {
    width: 360,
    height: 360,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
  },
  bottomSection: {
    flex: 0.38,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 32,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginHorizontal: 4,
  },
  dotActive: {
    width: 22,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  continueButton: {
    width: '100%',
    paddingVertical: 17,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
