import { StatusBar as ExpoStatusBar, StatusBarProps } from 'expo-status-bar';
import React from 'react';
import { StatusBar as RNStatusBar, StatusBarProps as RNStatusBarProps } from 'react-native';

import { useSelector } from 'react-redux';

import type { RootState } from '../redux/store';
import { useTheme } from '../theme/ThemeContext';

/**
 * Drop-in replacement for expo-status-bar's StatusBar.
 *
 * Screens written for the light theme ask for `style="dark"` (dark icons).
 * In the dark theme that would be dark-on-dark, so a "dark" request is turned
 * into light icons there. `style="light"` is left alone - those are screens
 * drawing over a gradient/hero image, which stays dark in both themes.
 */
export function StatusBar({ style, ...rest }: StatusBarProps) {
  const { isDark } = useTheme();
  // While the full-screen "can't reach our servers" view is up, the screens
  // underneath are still mounted and still ask for their own icon colour (e.g.
  // Home wants white over its gradient) - which turned the icons white on the
  // overlay's plain background. Force the active theme's normal contrast instead.
  const overlayUp = useSelector((state: RootState) => state.connectivity?.serverUnreachable);
  const resolved = overlayUp ? (isDark ? 'light' : 'dark') : style === 'dark' && isDark ? 'light' : style;
  return <ExpoStatusBar style={resolved} {...rest} />;
}

/**
 * Same idea for react-native's own StatusBar (`barStyle` API): "dark-content"
 * becomes light content in the dark theme, and a plain white background colour
 * follows the theme's card colour.
 */
export function AdaptiveStatusBar({ barStyle, backgroundColor, ...rest }: RNStatusBarProps) {
  const { isDark, theme } = useTheme();
  const resolvedStyle = barStyle === 'dark-content' && isDark ? 'light-content' : barStyle;
  const isWhite = typeof backgroundColor === 'string' && ['#fff', '#ffffff'].includes(backgroundColor.toLowerCase());
  return (
    <RNStatusBar
      barStyle={resolvedStyle}
      backgroundColor={isWhite ? theme.card : backgroundColor}
      {...rest}
    />
  );
}

export default StatusBar;
