import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '../i18n/LanguageContext';
import { darkTheme, lightTheme } from '../theme/colors';

interface Props {
  // The theme being switched TO - the overlay already wears its colours, so
  // the user never sees a flash of the old theme behind it.
  toDark: boolean;
}

// Shown while the app re-renders with a new theme. Re-colouring every screen
// blocks the JS thread for a couple of seconds, so this is painted first; the
// spinner is a native animation and keeps turning through the freeze.
export default function ThemeSwitchOverlay({ toDark }: Props) {
  const { t } = useLanguage();
  const c = toDark ? darkTheme : lightTheme;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 140, useNativeDriver: true }).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.scrim, { backgroundColor: c.background + 'F2', opacity }]}
      // Swallow touches so nothing is tapped mid-switch.
      pointerEvents="auto"
    >
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <ActivityIndicator size="large" color={c.primary} />
        <Text style={[styles.label, { color: c.text }]}>{t('applying_theme')}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    minWidth: 190,
    paddingVertical: 26,
    paddingHorizontal: 32,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
});
