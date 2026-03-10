import { searchGlobal } from '@/src/services/api/search.api';
import { normalizeSearchResponse } from './normalizers';
import { SearchResult } from './search.types';

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
