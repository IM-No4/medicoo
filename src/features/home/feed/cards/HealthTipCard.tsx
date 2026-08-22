import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppIcon from '../../../../components/icons/AppIcon';
import { HealthTipFeedItem } from '../feed.types';

type Props = {
  data: HealthTipFeedItem;
};

function HealthTipCard({ data }: Props) {
  const accentColor = data.accentColor || '#10B981';

  return (
    <View style={[styles.container, { backgroundColor: `${accentColor}10` }]}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: `${accentColor}20` }]}>
          <AppIcon name={data.icon as any || "lightbulb"} size={20} color={accentColor} />
        </View>
        <Text style={[styles.heading, { color: accentColor }]}>{data.title || "Daily Insight"}</Text>
      </View>

      <Text style={styles.content}>{data.content}</Text>

      {data.tags && (
        <View style={styles.tagsContainer}>
          {data.tags.map((tag, index) => (
            <View key={index} style={[styles.tag, { borderColor: `${accentColor}30` }]}>
              <Text style={[styles.tagText, { color: accentColor }]}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default React.memo(HealthTipCard);

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 28,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
