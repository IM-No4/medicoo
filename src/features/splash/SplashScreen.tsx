import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Image, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../../i18n/LanguageContext';

export default function SplashScreen() {
  const { t } = useLanguage();
  const gradientStart = Platform.select({
    ios: { x: 0, y: 0 },
    android: { x: 0.2, y: 0 },
  });

  const gradientEnd = Platform.select({
    ios: { x: 1, y: 0.9 },
    android: { x: 0.8, y: 1 },
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#10B981" />

      {/* Gradient Background */}
      <LinearGradient
        colors={['#10B981', '#007C69']}
        start={gradientStart}
        end={gradientEnd}
        style={StyleSheet.absoluteFill}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Logo Circle */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.tagline}>{t('your_health_our_priority')}</Text>

        {/* Loading Indicator */}
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#10B981',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
  },
  logo: {
    width: 220,
    height: 200,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '400',
    marginBottom: 48,
  },
  loaderContainer: {
    marginTop: 24,
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom: 4,
  },
  version: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
