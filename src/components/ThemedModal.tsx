import * as NavigationBar from 'expo-navigation-bar';
import React, { useEffect } from 'react';
import { Modal as RNModal, ModalProps, Platform } from 'react-native';

import { useTheme } from '../theme/ThemeContext';

/**
 * Drop-in replacement for react-native's Modal.
 *
 * On Android a Modal opens in its own window, and the system navigation bar
 * there falls back to the OS default (white bar, dark buttons) instead of the
 * app's themed strip. While a modal is visible this keeps the bar's colour and
 * button style in sync with the active theme, the same way the doctor app does.
 */
export function Modal(props: ModalProps) {
  const { isDark } = useTheme();
  const { visible } = props;

  useEffect(() => {
    if (Platform.OS !== 'android' || !visible) return;
    // setBackgroundColorAsync is a no-op (with a warning) on some edge-to-edge
    // setups - never let a rejected promise surface from here.
    NavigationBar.setBackgroundColorAsync(isDark ? '#080E17' : '#FFFFFF').catch(() => {});
    NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark').catch(() => {});
  }, [visible, isDark]);

  return <RNModal {...props} />;
}

export default Modal;
