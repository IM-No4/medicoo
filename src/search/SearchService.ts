import { searchGlobal } from '@/src/services/api/search.api';
import { normalizeSearchResponse } from './normalizers';
import { SearchResult } from './search.types';

export async function globalSearch(
  query: string,
  category?: string,
  type?: string
): Promise<SearchResult[]> {
  const apiData = await searchGlobal(query, category, type);
  return normalizeSearchResponse(apiData);
}
