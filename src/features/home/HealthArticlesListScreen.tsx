import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from '../../components/icons/AppIcon';
import { feedApi, HealthArticleDto } from '../../services/api/feed.api';

// The Health Knowledge Hub's "See All" - previously handed off to an
// external medicoo.com/blog URL. Now an in-app modal listing every active
// article (the home feed's showcase row only carries the top 3), each
// opening the same in-app HealthArticleDetail modal.
export default function HealthArticlesListScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [articles, setArticles] = useState<HealthArticleDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    feedApi
      .getHealthArticles()
      .then(setArticles)
      .catch((e) => console.warn('Failed to load health articles', e))
      .finally(() => setLoading(false));
  }, []);

  const openArticle = (article: HealthArticleDto) => {
    navigation.navigate('HealthArticleDetail', {
      title: article.title,
      category: article.category,
      readTime: article.readTime,
      author: article.author,
      imageUrl: article.imageUrl,
      content: article.content,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 8) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <ChevronLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Knowledge Hub</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#0FBBA1" />
        </View>
      ) : articles.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>No articles available right now.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {articles.map((article) => (
            <TouchableOpacity
              key={article.id}
              style={styles.card}
              activeOpacity={0.75}
              onPress={() => openArticle(article)}
            >
              <View style={styles.imageWrapper}>
                {article.imageUrl ? (
                  <Image source={{ uri: article.imageUrl }} style={styles.image} resizeMode="cover" />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <AppIcon name="file-text" size={24} color="#9CA3AF" />
                  </View>
                )}
              </View>

              <View style={styles.cardContent}>
                {!!article.category && <Text style={styles.category}>{article.category}</Text>}
                <Text style={styles.cardTitle} numberOfLines={2}>{article.title}</Text>
                <View style={styles.metaRow}>
                  {!!article.author && <Text style={styles.metaText}>By {article.author}</Text>}
                  {!!article.author && !!article.readTime && <View style={styles.dot} />}
                  {!!article.readTime && <Text style={styles.metaText}>{article.readTime}</Text>}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: '#F8F9FE',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  imageWrapper: {
    width: 84,
    height: 84,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  category: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0FBBA1',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 20,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#9CA3AF',
  },
});
