import React from 'react';
import { Text, View } from 'react-native';
import { useMemo } from 'react';
import { createStyles } from '../styles';
import { useTheme } from '../../../theme/ThemeContext';

interface Props {
  title: string;
  children: React.ReactNode;
}

export default function CalendarSection({ title, children }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={{ marginTop: 24 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}
