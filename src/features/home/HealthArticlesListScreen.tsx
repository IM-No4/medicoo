import { useNavigation } from '@react-navigation/native';
import { StatusBar } from '../../components/ThemedStatusBar';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useState, useMemo } from 'react';
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
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';

// The Health Knowledge Hub's "See All" - previously handed off to an
// external medicoo.com/blog URL. Now an in-app modal listing every active
// article (the home feed's showcase row only carries the top 3), each
// opening the same in-app HealthArticleDetail modal.
export default function HealthArticlesListScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
          <ChevronLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('health_hub')}</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#10B981" />
        </View>
      ) : articles.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>{t('no_articles')}</Text>
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
                    <AppIcon name="file-text" size={24} color={theme.textMuted} />
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

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: c.cardSecondary,
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
    color: c.text,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: c.textSecondary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: c.card,
    borderRadius: 16,
    marginBottom: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: c.borderLight,
  },
  imageWrapper: {
    width: 84,
    height: 84,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: c.cardSecondary,
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
    color: '#10B981',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: c.text,
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
    color: c.textSecondary,
    fontWeight: '500',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#9CA3AF',
  },
});
