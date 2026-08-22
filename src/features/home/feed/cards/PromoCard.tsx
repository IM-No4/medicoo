import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../../../../components/icons/AppIcon';
import { FeedAction } from '../feed.actions';
import { PromoFeedItem, PromoItem } from '../feed.types';

type Props = {
  data: PromoFeedItem;
  onAction?: (action: FeedAction) => void;
};

const PromoItemCard = ({ item, onAction }: { item: PromoItem; onAction?: (action: FeedAction) => void }) => {
  const gradientColors = item.background
    ? [item.background.start, item.background.end]
    : ['#4f9cff', '#2563eb'];

  const handlePress = () => {
    if (item.action && onAction) {
      onAction(item.action);
    }
  };

  return (
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
        disabled={!item.action}
      >
        <View style={styles.textContainer}>
          {item.subtitle && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.subtitle}</Text>
            </View>
          )}
          <Text style={styles.title}>{item.title}</Text>
          {item.description && (
            <Text style={styles.description}>{item.description}</Text>
          )}

          {item.ctaText && (
            <View style={styles.button}>
              <Text style={[styles.buttonText, { color: gradientColors[1] }]}>
                {item.ctaText}
              </Text>
            </View>
          )}
        </View>

        {item.icon && (
          <View style={styles.iconContainer}>
            <AppIcon name={item.icon as any} size={48} color="rgba(255,255,255,0.2)" />
          </View>
        )}
      </TouchableOpacity>
    </LinearGradient>
  );
};

function PromoCard({ data, onAction }: Props) {
  if (data.displayMode === 'CAROUSEL') {
    return (
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {data.items.map((item) => (
            <View key={item.id} style={styles.carouselItemWrapper}>
              <PromoItemCard item={item} onAction={onAction} />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  // Default to LIST
  return (
    <View style={styles.container}>
      {data.items.map((item) => (
        <View key={item.id} style={styles.listItemWrapper}>
          <PromoItemCard item={item} onAction={onAction} />
        </View>
      ))}
    </View>
  );
}

export default React.memo(PromoCard);

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  listItemWrapper: {
    paddingHorizontal: 20,
    marginBottom: 20, // Add spacing between list items if there are multiple
  },
  carouselItemWrapper: {
    width: 300,
    marginRight: 16,
  },
  card: {
    borderRadius: 16,
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
