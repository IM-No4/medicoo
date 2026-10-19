import React from 'react';
import { Text, View } from 'react-native';
import { useMemo } from 'react';
import { createStyles } from '../styles';
import { useTheme } from '../../../theme/ThemeContext';

interface Props {
  title: string;
  subtitle: string;
}

export default function CalendarItemCard({
  title,
  subtitle,
}: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}
