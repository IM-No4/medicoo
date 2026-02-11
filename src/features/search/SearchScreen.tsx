import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { AppDispatch, RootState } from '@/src/redux/store';
import {
  clearSearch,
  executeGlobalSearch,
  setQuery,
} from '@/src/search/search.slice';

import RecentSearches from './components/RecentSearches';
import SearchCategories from './components/SearchCategories';
import SearchEmptyState from './components/SearchEmptyState';
import SearchErrorState from './components/SearchErrorState';
import SearchHeader from './components/SearchHeader';
import SearchResults from './components/SearchResults';
import SearchResultSkeleton from './components/SearchResultSkeleton';
import { getRecentSearches } from './utils/recentSearches';

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

  const { query, results, loading, error } = useSelector(
    (state: RootState) => state.search
  );

  useEffect(() => {
    // If we have initial query params, execute search immediately
    if (params.query) {
      dispatch(setQuery(params.query));
      // Don't focus keyboard if pre-filled, let results load
      // inputRef.current?.focus(); 
      hasSearchedRef.current = true;
      lastDispatchedQueryRef.current = params.query;
      dispatch(executeGlobalSearch({
        query: params.query,
        category: params.category,
        type: params.type
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

    // Use current params if they match current query to keep filtering
    // If user changes query, we drop special filters usually, or keep them?
    // For now assuming filters drop if user types manually unless we store them in Redux

    const t = setTimeout(() => {
      lastDispatchedQueryRef.current = query;
      hasSearchedRef.current = true;
      dispatch(executeGlobalSearch({ query }));
    }, 300);

    return () => clearTimeout(t);
  }, [query, dispatch]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" backgroundColor="#ffffff" />

        <SearchHeader
          ref={inputRef}
          value={query}
          loading={loading}
          onChange={(v) => dispatch(setQuery(v))}
          onBack={() => {
            dispatch(clearSearch()); // ✅ explicit exit
            navigation.goBack();
          }}
          onSubmit={() => Keyboard.dismiss()}
        />

        {!hasSearchedRef.current && query.trim().length === 0 ? (
          <>
            <RecentSearches
              items={recentSearches}
              onSelect={(q) => dispatch(setQuery(q))}
            />
            <SearchCategories />
          </>
        ) : loading ? (
          <SearchResultSkeleton />
        ) : error ? (
          <SearchErrorState
            message={error}
            onRetry={() => dispatch(executeGlobalSearch({ query }))}
          />
        ) : results.length === 0 ? (
          <SearchEmptyState query={query} />
        ) : (
          <SearchResults results={results} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
