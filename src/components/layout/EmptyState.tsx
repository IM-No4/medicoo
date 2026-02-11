import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  title: string;
  message: string;
}

export default function EmptyState({ title, message }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 40,
    alignItems: 'center',
  },

  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#151517',
    marginBottom: 6,
  },

  message: {
    fontSize: 14,
    color: '#151517',
    opacity: 0.6,
    textAlign: 'center',
  },
});
