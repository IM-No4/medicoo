import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, Dimensions, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from '../../components/icons/AppIcon';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';

const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 25;

const Particle = () => {
  const anim = useRef(new Animated.Value(0)).current;
  const randomX = Math.random() * width;
  const randomDelay = Math.random() * 1000;
  const randomDuration = 2500 + Math.random() * 1500;
  const randomColor = ['#FFD700', '#FF6347', '#32CD32', '#1E90FF', '#FF69B4', '#FFF'][Math.floor(Math.random() * 6)];
  const randomSize = 6 + Math.random() * 6;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: randomDuration,
          delay: randomDelay,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, height + 50],
  });

  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: randomX,
        top: 0,
        width: randomSize,
        height: randomSize,
        backgroundColor: randomColor,
        transform: [{ translateY }, { rotate }],
        borderRadius: randomSize / 2,
        opacity: 0.8,
      }}
    />
  );
};

export default function BookingSuccessScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const forName: string | null = route.params?.forName || null;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007C69" />
      
      {/* Confetti Particles */}
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <Particle key={i} />
      ))}

      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
          <AppIcon name="check-circle" size={64} color="#fff" />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
          <Text style={styles.title}>{t('request_sent')}</Text>
          <Text style={styles.subtitle}>
            {t('your_appointment_request_has_been_sent')}
          </Text>
          {forName ? (
            <View style={styles.forPill}>
              <Text style={styles.forPillText}>Booked by you for {forName}</Text>
            </View>
          ) : null}
        </Animated.View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.button} onPress={handleHome}>
          <Text style={styles.buttonText}>{t('back_to_home')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center', paddingHorizontal: 40 },
  iconContainer: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 32,
    borderWidth: 4, borderColor: 'rgba(255,255,255,0.4)',
  },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 24 },
  forPill: { marginTop: 16, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)' },
  forPillText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  footer: { position: 'absolute', bottom: 50, left: 20, right: 20 },
  button: {
    backgroundColor: c.card, paddingVertical: 16, borderRadius: 24, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#007C69' },
});