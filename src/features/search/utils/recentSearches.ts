import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'RECENT_SEARCHES_V1';
const MAX = 8;

export async function getRecentSearches(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

export async function saveRecentSearch(query: string) {
  const raw = await AsyncStorage.getItem(KEY);
  const existing: string[] = raw ? JSON.parse(raw) : [];

  const next = [
    query,
    ...existing.filter((q) => q !== query),
  ].slice(0, MAX);

  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function clearRecentSearches() {
  await AsyncStorage.removeItem(KEY);
}
