import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../../../../components/icons/AppIcon';
import { FeedAction } from '../feed.actions';
import { PromoFeedItem } from '../feed.types';

type Props = {
  data: PromoFeedItem;
  onAction?: (action: FeedAction) => void;
};

function PromoCard({ data, onAction }: Props) {
  const gradientColors = data.background
    ? [data.background.start, data.background.end]
    : ['#4f9cff', '#2563eb'];

  const handlePress = () => {
    if (data.action && onAction) {
      onAction(data.action);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradientColors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handlePress}
          style={styles.content}
          disabled={!data.action}
        >
          <View style={styles.textContainer}>
            {data.subtitle && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{data.subtitle}</Text>
              </View>
            )}
            <Text style={styles.title}>{data.title}</Text>
            {data.description && (
              <Text style={styles.description}>{data.description}</Text>
            )}

            {data.ctaText && (
              <View style={styles.button}>
                <Text style={[styles.buttonText, { color: gradientColors[1] }]}>
                  {data.ctaText}
                </Text>
              </View>
            )}
          </View>

          {data.icon && (
            <View style={styles.iconContainer}>
              <AppIcon name={data.icon as any} size={48} color="rgba(255,255,255,0.2)" />
            </View>
          )}
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

export default React.memo(PromoCard);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    minHeight: 160,
    // Add shadow
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    lineHeight: 28,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 20,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  buttonText: {
    fontWeight: '700',
    fontSize: 14,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
