import { ArrowRight } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const slides = [
  {
    id: 1,
    title: 'Book Doctors Instantly',
    description: 'Connect with verified doctors anytime, anywhere. Get instant consultations via chat, voice, or video call.',
    illustration: require('../../assets/images/doctor-consultation.png'),
    blobStyle: {
      width: '100%',
      height: '90%',
      borderRadius: 180,
      transform: [{ scaleX: 1.2 }, { scaleY: 0.85 }, { rotate: '-15deg' }],
    },
  },
  {
    id: 2,
    title: 'Order Medicines Easily',
    description: 'Browse thousands of medicines and healthcare products. Get them delivered to your doorstep quickly.',
    illustration: require('../../assets/images/medicine-delivery.png'),
    blobStyle: {
      width: '95%',
      height: '95%',
      borderRadius: 200,
      transform: [{ scaleX: 0.9 }, { scaleY: 1.1 }, { rotate: '25deg' }],
    },
  },
  {
    id: 3,
    title: 'Manage Your Health',
    description: 'Track appointments, medications, and health records all in one place. Your health, simplified.',
    illustration: require('../../assets/images/health-tracking.png'),
    blobStyle: {
      width: '105%',
      height: '88%',
      borderRadius: 190,
      transform: [{ scaleX: 1.15 }, { scaleY: 0.95 }, { rotate: '10deg' }],
    },
  },
];

export default function IntroScreen({ onFinish }: { onFinish: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const insets = useSafeAreaInsets();

  const handleNext = () => {
    if (currentIndex === slides.length - 1) {
      onFinish();
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const currentSlide = slides[currentIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Skip Button - Top Right */}
      <View style={[styles.skipContainer, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={onFinish} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Illustration with unique organic blob background */}
        <View style={styles.illustrationWrapper}>
          {/* Unique organic blob shape for each slide */}
          <View style={[styles.blobShape, currentSlide.blobStyle]} />

          <Image
            source={currentSlide.illustration}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>{currentSlide.title}</Text>

        {/* Description */}
        <Text style={styles.description}>{currentSlide.description}</Text>
      </View>

      {/* Bottom Section */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 24 }]}>
        {/* Pagination Dots */}
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

        {/* Large Circular Button */}
        <TouchableOpacity
          onPress={handleNext}
          style={styles.circleButton}
          activeOpacity={0.85}
        >
          <ArrowRight size={28} color="#ffffff" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  skipContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  illustrationWrapper: {
    width: '100%',
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  blobShape: {
    position: 'absolute',
    backgroundColor: '#E8F5E9',
  },
  illustration: {
    width: '75%',
    height: '75%',
    zIndex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  bottomContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  dotActive: {
    width: 8,
    height: 8,
    backgroundColor: '#2FA561',
  },
  circleButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2FA561',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2FA561',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
});
