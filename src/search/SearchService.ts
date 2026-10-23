import { fetchSuggestionList, searchGlobal } from '@/src/services/api/search.api';
import { normalizeSearchResponse } from './normalizers';
import { SearchExtra, SearchResult, SearchSuggestion } from './search.types';

export async function fetchSuggestions(query: string, lat?: number, lng?: number): Promise<SearchSuggestion[]> {
  return fetchSuggestionList(query, lat, lng);
}

// One page of results (medicine results come a page of pharmacies at a time) and whether there are more pages.
export async function globalSearchPage(
  query: string,
  category?: string,
  type?: string,
  tags?: string[],
  pincodeLat?: number,
  pincodeLng?: number,
  page = 1,
  extra?: SearchExtra
): Promise<{ results: SearchResult[]; hasMore: boolean }> {
  const apiData = await searchGlobal(query, category, type, tags, pincodeLat, pincodeLng, page, extra);
  return { results: normalizeSearchResponse(apiData), hasMore: !!apiData.pagination?.hasMore };
}

export async function globalSearch(
  query: string,
  category?: string,
  type?: string,
  tags?: string[],
  pincodeLat?: number,
  pincodeLng?: number
): Promise<SearchResult[]> {
  const apiData = await searchGlobal(query, category, type, tags, pincodeLat, pincodeLng);
  return normalizeSearchResponse(apiData);
}
