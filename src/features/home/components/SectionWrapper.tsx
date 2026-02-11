import React from 'react';
import { Text, View } from 'react-native';

export default function SectionWrapper({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 24, paddingHorizontal: 16 }}>
      {title && (
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}
