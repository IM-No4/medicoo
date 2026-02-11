import React from 'react';
import { Text, View } from 'react-native';
import { ReminderFeedItem } from '../feed.types';

export default function ReminderCard({
  data,
}: {
  data: ReminderFeedItem;
}) {
  return (
    <View
      style={{
        backgroundColor: '#FFF3E0',
        padding: 16,
        borderRadius: 12,
        marginBottom: 28,
        marginHorizontal: 20,
      }}
    >
      <Text style={{ fontSize: 15, fontWeight: '600' }}>
        {data.text}
      </Text>
      <Text style={{ marginTop: 4, color: '#555' }}>
        {data.dueAt}
      </Text>
    </View>
  );
}
