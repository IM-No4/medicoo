export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryBg: string;
  background: string;
  card: string;
  cardSecondary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  inputBg: string;
  inputBorder: string;
  error: string;
  errorBg: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  info: string;
  infoBg: string;
  shadow: string;
  isDark: boolean;
}

export const lightTheme: ThemeColors = {
  primary: '#10B981',
  primaryLight: '#D1FAE5',
  primaryDark: '#065F46',
  primaryBg: '#ECFDF5',
  background: '#F8FAFC',
  card: '#FFFFFF',
  cardSecondary: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  inputBg: '#F8FAFB',
  inputBorder: '#E2E8F0',
  error: '#EF4444',
  errorBg: '#FEF2F2',
  success: '#10B981',
  successBg: '#ECFDF5',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  info: '#3B82F6',
  infoBg: '#EFF6FF',
  shadow: '#000000',
  isDark: false,
};

export const darkTheme: ThemeColors = {
  primary: '#10B981',
  primaryLight: '#12453A',
  primaryDark: '#0A2F26',
  primaryBg: '#0F2E27',
  background: '#0B131E',
  card: '#16222F',
  cardSecondary: '#1E2D3D',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#27384A',
  borderLight: '#1E2D3D',
  inputBg: '#1E2D3D',
  inputBorder: '#27384A',
  error: '#F87171',
  errorBg: '#3B2227',
  success: '#34D399',
  successBg: '#143A36',
  warning: '#FBBF24',
  warningBg: '#3A2F1C',
  info: '#60A5FA',
  infoBg: '#1C3049',
  shadow: '#000000',
  isDark: true,
};
