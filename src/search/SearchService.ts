import { searchGlobal } from '@/src/services/api/search.api';
import { normalizeSearchResponse } from './normalizers';
import { SearchResult } from './search.types';

// One page of results (medicine results come a page of pharmacies at a time) and whether there are more pages.
export async function globalSearchPage(
  query: string,
  category?: string,
  type?: string,
  tags?: string[],
  pincodeLat?: number,
  pincodeLng?: number,
  page = 1
): Promise<{ results: SearchResult[]; hasMore: boolean }> {
  const apiData = await searchGlobal(query, category, type, tags, pincodeLat, pincodeLng, page);
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
