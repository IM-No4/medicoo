import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import AppIcon from '@/src/components/icons/AppIcon';

import { AppDispatch, RootState } from '@/src/redux/store';
import {
  clearSearch,
  executeGlobalSearch,
  fetchSearchSuggestions,
  setQuery,
} from '@/src/search/search.slice';
import { SearchResult } from '@/src/search/search.types';

import RecentSearches from './components/RecentSearches';
import SearchCategories from './components/SearchCategories';
import SearchEmptyState from './components/SearchEmptyState';
import SearchErrorState from './components/SearchErrorState';
import SearchHeader from './components/SearchHeader';
import SearchResults from './components/SearchResults';
import SearchResultSkeleton from './components/SearchResultSkeleton';
import SearchSuggestions from './components/SearchSuggestions';
import { clearRecentSearches, getRecentSearches } from './utils/recentSearches';

export type SearchTab = 'Medicines' | 'Pharmacies';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = route.params || {};

  const inputRef = useRef<any>(null);
  const hasSearchedRef = useRef(false);

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const lastDispatchedQueryRef = useRef<string>('');
  const [activeTab, setActiveTab] = useState<SearchTab | null>(null);
  const [isPrescriptionOnly, setIsPrescriptionOnly] = useState(false);

  const { query, results, loading, error, suggestions, loadingSuggestions } = useSelector(
    (state: RootState) => state.search
  );

  const handleManualSearch = (q: string) => {
    Keyboard.dismiss();
    dispatch(setQuery(q));
    hasSearchedRef.current = true;
    lastDispatchedQueryRef.current = q;
    dispatch(executeGlobalSearch({ query: q }));
  };

  const handleClearRecent = async () => {
    await clearRecentSearches();
    setRecentSearches([]);
  };

  const handleCategorySelect = (title: string, tags: string[]) => {
    Keyboard.dismiss();
    dispatch(setQuery(title));
    hasSearchedRef.current = true;
    lastDispatchedQueryRef.current = title;
    // Category taps aren't a user-typed search term - same reasoning as
    // the tags-driven params.query handling below, don't pollute recent
    // searches with it.
    dispatch(executeGlobalSearch({ query: title, tags, recordRecent: false }));
  };

  useEffect(() => {
    // If we have initial query params, execute search immediately
    if (params.query) {
      dispatch(setQuery(params.query));
      hasSearchedRef.current = true;
      lastDispatchedQueryRef.current = params.query;

      const isFromTags = params.tags && params.tags.length > 0;

      dispatch(executeGlobalSearch({
        query: params.query,
        category: params.category,
        type: params.type,
        tags: params.tags,
        recordRecent: !isFromTags
      }));
    } else {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, []);

  useEffect(() => {
    getRecentSearches().then(setRecentSearches);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) return;
    if (lastDispatchedQueryRef.current === query) return;

    const t = setTimeout(() => {
      lastDispatchedQueryRef.current = query;
      hasSearchedRef.current = false;
      dispatch(fetchSearchSuggestions({ query }));
    }, 300);

    return () => clearTimeout(t);
  }, [query, dispatch]);

  // Auto-switch tabs based on results
  const lastSwitchResultsRef = useRef<SearchResult[] | null>(null);

  useEffect(() => {
    if (!loading && hasSearchedRef.current && results.length > 0 && results !== lastSwitchResultsRef.current) {
      const hasMedicines = results.some(r => r.domain === 'medicine');
      const hasPharmacies = results.some(r => r.domain === 'pharmacy');

      if (!hasMedicines && hasPharmacies) {
        setActiveTab('Pharmacies');
      } else if (hasMedicines && !hasPharmacies) {
        setActiveTab('Medicines');
      } else if (!activeTab) {
        // Default to Medicines if it's the first load and we have medicines (or both)
        setActiveTab('Medicines');
      }
      lastSwitchResultsRef.current = results;
    } else if (query.trim().length === 0) {
      // Reset tab when search is cleared
      setActiveTab(null);
      lastSwitchResultsRef.current = null;
    }
  }, [loading, results, query]);

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {(['Pharmacies', 'Medicines'] as SearchTab[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
            {tab}
          </Text>
          {activeTab === tab && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderFilters = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={styles.filterContainer}
    >
      <TouchableOpacity style={styles.filterChip}>
        <Text style={styles.filterText}>Sort By</Text>
        <AppIcon name="chevron-down" size={14} color="#374151" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.filterChip}>
        <Text style={styles.filterText}>Fast Delivery</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.filterChip}>
        <Text style={styles.filterText}>Ratings 4.0+</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.filterChip}>
        <Text style={styles.filterText}>Offers</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" backgroundColor="#ffffff" />
      <SearchHeader
        ref={inputRef}
        value={query}
        loading={loading}
        category={activeTab || 'Medicines'} // Fallback for header UI consistency
        showCategory={hasSearchedRef.current && query.trim().length > 0 && !!activeTab}
        isPrescriptionOnly={isPrescriptionOnly}
        onTogglePrescription={() => setIsPrescriptionOnly(!isPrescriptionOnly)}
        onChange={(v) => {
          dispatch(setQuery(v));
          hasSearchedRef.current = false;
        }}
        onBack={() => {
          dispatch(clearSearch());
          navigation.goBack();
        }}
        onSubmit={() => {
          Keyboard.dismiss();
        }}
      />

      {/* {hasSearchedRef.current && query.trim().length > 0 && activeTab && (
        <View style={styles.headerExtension}>
          {renderTabs()}
        </View>
      )} */}

      {/* Main Content Area */}
      {!hasSearchedRef.current && query.trim().length === 0 ? (
        <ScrollView style={styles.flex} keyboardShouldPersistTaps="handled">
          <RecentSearches
            items={recentSearches}
            onSelect={handleManualSearch}
            onClear={handleClearRecent}
          />
          <SearchCategories onSelectCategory={handleCategorySelect} />
        </ScrollView>
      ) : !hasSearchedRef.current && query.trim().length > 0 ? (
        <ScrollView style={styles.flex} keyboardShouldPersistTaps="handled">
          <SearchSuggestions
            suggestions={suggestions}
            onSelect={(item) => handleManualSearch(item.title)}
          />
          <RecentSearches
            items={recentSearches}
            onSelect={handleManualSearch}
            onClear={handleClearRecent}
          />
        </ScrollView>
      ) : loading ? (
        <View style={styles.flex}>
          <SearchResultSkeleton />
        </View>
      ) : error ? (
        <View style={styles.flex}>
          <SearchErrorState
            message={error}
            onRetry={() => dispatch(executeGlobalSearch({ query }))}
          />
        </View>
      ) : results.length === 0 ? (
        <View style={styles.flex}>
          <SearchEmptyState query={query} />
        </View>
      ) : activeTab ? (
        <View style={[styles.flex, { backgroundColor: '#F9FAFB' }]}>
          {renderFilters()}
          <SearchResults results={results} activeTab={activeTab!} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    height: 48,
  },
  tab: {
    height: 48,
    justifyContent: 'center',
    marginRight: 24,
    position: 'relative',
    paddingHorizontal: 4,
  },
  activeTab: {
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#111827',
    fontWeight: '900',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#111827',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  headerContainer: {
    backgroundColor: '#ffffff',
    zIndex: 10,
  },
  headerExtension: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterContainer: {
    marginTop: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ecececff',
    height: 34, // Very compact chips
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
});
