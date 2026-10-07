import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Share2 } from 'lucide-react-native';
import React from 'react';
import { Image, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from '../../components/icons/AppIcon';

// Reads a single Health Knowledge Hub article in-app, as a modal - replaces
// the old behavior of handing off to an external medicoo.com/blog URL that
// wasn't a real page. Every field arrives as a route param straight from
// the feed action (see homeController.js's HEALTH_ARTICLE_SHOWCASE case),
// so opening this needs no extra network round trip.
export default function HealthArticleDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const { title, category, readTime, author, imageUrl, content } = route.params || {};

  const handleShare = async () => {
    try {
      await Share.share({
        title,
        message: `${title}\n\n${content ? content.slice(0, 200) + (content.length > 200 ? '...' : '') : ''}\n\nRead more on Medicoo.`,
      });
    } catch (e) {
      console.error('Failed to share article', e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Solid status bar + header - a dedicated, opaque strip rather than
          the hero image bleeding straight under a translucent status bar.
          Same reasoning as LegalPage.tsx's fixed bottom strip below: with
          the app's Android nav/status bars forced transparent at the OS
          level, a "solid" look has to be painted by the screen itself. */}
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 8) }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <ChevronLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={handleShare} activeOpacity={0.8}>
          <Share2 size={19} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.heroWrapper}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <AppIcon name="file-text" size={48} color="#94A3B8" />
            </View>
          )}

          {!!category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{category}</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{title}</Text>

          {(author || readTime) && (
            <View style={styles.metaRow}>
              {!!author && <Text style={styles.metaText}>By {author}</Text>}
              {!!author && !!readTime && <View style={styles.dot} />}
              {!!readTime && <Text style={styles.metaText}>{readTime}</Text>}
            </View>
          )}

          <Text style={styles.contentText}>
            {content || 'This article is still being written up - check back soon.'}
          </Text>
        </View>
      </ScrollView>

      {/* Fixed (non-scrolling) solid footer behind the bottom nav bar - see
          the top strip comment above for why this has to be self-painted. */}
      <View style={{ height: Math.max(insets.bottom, 16), backgroundColor: '#FFFFFF' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWrapper: {
    height: 260,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    left: 20,
    bottom: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  body: {
    padding: 20,
    paddingBottom: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 30,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  metaText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#94A3B8',
  },
  contentText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#334155',
  },
});
