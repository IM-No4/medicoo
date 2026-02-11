import * as NavigationBar from 'expo-navigation-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export function useSystemUI() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    // White navigation bar
    NavigationBar.setBackgroundColorAsync('#ffffff');

    // Dark icons (or gray depending on system)
    NavigationBar.setButtonStyleAsync('dark');
  }, []);
}
