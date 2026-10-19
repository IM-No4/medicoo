import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { API_BASE_URL } from '../../../../services/api/client';
import { FeedAction } from '../feed.actions';
import { HeroBannerFeedItem } from '../feed.types';

type Props = {
  data: HeroBannerFeedItem;
  onAction?: (action: FeedAction) => void;
};

const resolveImage = (u?: string | null) => {
  if (!u) return null;
  return /^(https?:|data:)/i.test(u) ? u : `${API_BASE_URL}/${u.replace(/^\//, '')}`;
};

// Hero banner from the admin's App Configuration. Gradient background with an
// optional image on the right; tapping runs the configured action (search,
// screen or link).
function HeroBannerCard({ data, onAction }: Props) {
  const image = resolveImage(data.imageUrl);
  const colors = (data.gradient?.length >= 2 ? data.gradient : ['#10B981', '#007C69']) as [string, string, ...string[]];

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!data.action}
          onPress={() => data.action && onAction?.(data.action)}
          style={styles.content}
        >
          <View style={styles.textWrap}>
            {!!data.title && <Text style={styles.title}>{data.title}</Text>}
            {!!data.subtitle && <Text style={styles.subtitle}>{data.subtitle}</Text>}
            {!!data.ctaText && (
              <View style={styles.cta}>
                <Text style={[styles.ctaText, { color: colors[colors.length - 1] }]}>{data.ctaText}</Text>
              </View>
            )}
          </View>
          {!!image && <Image source={{ uri: image }} style={styles.image} resizeMode="contain" />}
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

export default React.memo(HeroBannerCard);

const styles = StyleSheet.create({
  container: { marginHorizontal: 20, marginBottom: 30 },
  card: { borderRadius: 20, overflow: 'hidden', minHeight: 150 },
  content: { flexDirection: 'row', alignItems: 'center', padding: 22, minHeight: 150 },
  textWrap: { flex: 1, paddingRight: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', lineHeight: 28, marginBottom: 6 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 20, marginBottom: 14 },
  cta: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', paddingVertical: 9, paddingHorizontal: 18, borderRadius: 12 },
  ctaText: { fontSize: 14, fontWeight: '700' },
  image: { width: 110, height: 110 },
});
