import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../styles';

interface Props {
  title: string;
  children: React.ReactNode;
}

export default function CalendarSection({ title, children }: Props) {
  return (
    <View style={{ marginTop: 24 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}
