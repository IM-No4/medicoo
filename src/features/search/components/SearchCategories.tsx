import AppIcon from '@/src/components/icons/AppIcon';
import { feedApi, ShopCategory } from '@/src/services/api/feed.api';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  onSelectCategory: (title: string, tags: string[]) => void;
}

// Same admin-managed category list as the home feed's "Shop by Category"
// row (real medicine categories - Baby Care, Cold & Flu, etc.), fetched
// standalone since this screen doesn't load the home feed. Replaces the
// old hardcoded doctors/medicines/labs/services list, which didn't fit the
// app's medicine-only mode and had no real tap behavior.
export default function SearchCategories({ onSelectCategory }: Props) {
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    feedApi.getShopCategories()
      .then(data => { if (!cancelled) setCategories(data); })
      .catch(() => { /* leave empty - section just won't render */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <View style={styles.section}>
        <Text style={styles.title}>Browse by Category</Text>
        <ActivityIndicator color="#0FBBA1" style={{ marginTop: 12 }} />
      </View>
    );
  }

  if (categories.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Browse by Category</Text>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            activeOpacity={0.75}
            onPress={() => onSelectCategory(item.title, item.tags)}
          >
            <View style={styles.circle}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
              ) : (
                <AppIcon name="shopping-bag" size={28} color="#9CA3AF" />
              )}
            </View>
            <Text style={styles.label} numberOfLines={2}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  item: {
    width: 78,
    alignItems: 'center',
    marginRight: 16,
  },
  circle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});
