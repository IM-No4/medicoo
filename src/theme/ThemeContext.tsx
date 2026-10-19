import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as NavigationBar from 'expo-navigation-bar';
import { Appearance, Platform, useColorScheme } from 'react-native';

import ThemeSwitchOverlay from '../components/ThemeSwitchOverlay';
import { darkTheme, lightTheme, ThemeColors, ThemeMode } from './colors';

const THEME_STORAGE_KEY = '@medicoo_consumer_theme_mode';

interface ThemeContextType {
  theme: ThemeColors;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDark: false,
  themeMode: 'light',
  setThemeMode: async () => {},
  toggleTheme: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [modeLoaded, setModeLoaded] = useState(false);
  // Re-colouring every screen blocks the JS thread for a moment - this drives
  // the "Applying theme" overlay so the user sees something is happening.
  const [switching, setSwitching] = useState(false);
  const [switchingToDark, setSwitchingToDark] = useState(false);
  const switchPending = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
          setThemeModeState(saved as ThemeMode);
        }
      })
      .catch(() => {})
      .finally(() => setModeLoaded(true));
  }, []);

  // Tell the OS which mode the app is in. Android Modals/dialogs open in their
  // own window and follow the *system* night mode, not our in-app theme - so
  // with the phone in light mode and the app set to dark, a modal's system
  // navigation bar came up light. Overriding the app's colour scheme makes
  // those windows follow the app. 'system' clears the override. Waits for the
  // saved choice to load so we never briefly force the wrong mode on launch.
  useEffect(() => {
    if (!modeLoaded) return;
    try {
      Appearance.setColorScheme(themeMode === 'system' ? null : themeMode);
    } catch {
      // older RN / unsupported platform - the in-app theme still works
    }
  }, [themeMode, modeLoaded]);

  const isDark = themeMode === 'system' ? systemColorScheme === 'dark' : themeMode === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  useEffect(() => {
    // Edge-to-edge (app.json) makes setBackgroundColorAsync unsupported - the
    // bar's background is the solid strip in App.tsx's SystemNavBarBackground.
    if (Platform.OS === 'android') {
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark').catch(() => {});
    }
  }, [isDark]);

  const setThemeMode = async (mode: ThemeMode) => {
    if (mode === themeMode) return;
    const targetDark = mode === 'system' ? systemColorScheme === 'dark' : mode === 'dark';
    switchPending.current = true;
    setSwitchingToDark(targetDark);
    setSwitching(true);
    // Give the overlay a moment to actually paint before the heavy re-render
    // starts; once the JS thread is busy nothing new can be drawn.
    await new Promise((resolve) => setTimeout(resolve, 120));
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {});
  };

  // The new theme has been rendered (this runs after the commit) - let it
  // paint for a beat, then drop the overlay.
  useEffect(() => {
    if (!switchPending.current) return;
    const timer = setTimeout(() => {
      switchPending.current = false;
      setSwitching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [themeMode]);

  const toggleTheme = async () => {
    const nextMode = isDark ? 'light' : 'dark';
    await setThemeMode(nextMode);
  };

  // Hold the first render until the saved light/dark choice is read (a few ms,
  // while the native splash is still up) so no screen - least of all an error or
  // offline screen - ever flashes the wrong theme on launch.
  if (!modeLoaded) return null;

  return (
    <ThemeContext.Provider value={{ theme, isDark, themeMode, setThemeMode, toggleTheme }}>
      {children}
      {switching && <ThemeSwitchOverlay toDark={switchingToDark} />}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
