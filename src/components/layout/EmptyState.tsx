import { CalendarClock } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';

interface Props {
  title: string;
  message: string;
  icon?: typeof CalendarClock;
  iconColor?: string;
  iconBg?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title,
  message,
  icon: Icon = CalendarClock,
  iconColor = '#10B981',
  iconBg,
  actionLabel,
  onAction,
}: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.container}>
      {/* The pale mint circle glares on a dark screen: there it is a soft tint of the icon's colour. */}
      <View style={[styles.iconCircle, { backgroundColor: iconBg ?? (theme.isDark ? `${iconColor}26` : '#EAFBF3') }]}>
        <Icon size={28} color={iconColor} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    padding: 40,
    alignItems: 'center',
  },

  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  title: {
    fontSize: 16,
    fontWeight: '700',
    color: c.text,
    marginBottom: 6,
  },

  message: {
    fontSize: 14,
    color: c.text,
    opacity: 0.6,
    textAlign: 'center',
  },

  actionButton: {
    marginTop: 20,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
  },

  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
