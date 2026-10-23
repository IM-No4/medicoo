// What the chips on the search results do. `sort` cycles on each tap of the Sort chip; the other three are on/off.
export type SearchSort = 'relevance' | 'nearest' | 'rating';

export type SearchFilters = {
  sort: SearchSort;
  fastDelivery: boolean; // delivery in 30 minutes or less
  topRated: boolean; // rated 4.0 or more
  offers: boolean; // only medicines that carry a discount
};

export const DEFAULT_SEARCH_FILTERS: SearchFilters = { sort: 'relevance', fastDelivery: false, topRated: false, offers: false };

export const FAST_DELIVERY_MINS = 30;
export const TOP_RATED_MIN = 4;

export const NEXT_SORT: Record<SearchSort, SearchSort> = { relevance: 'nearest', nearest: 'rating', rating: 'relevance' };
export const SORT_LABEL: Record<SearchSort, string> = { relevance: 'Sort by', nearest: 'Nearest', rating: 'Top rated' };

export const anyFilterOn = (f: SearchFilters) => f.sort !== 'relevance' || f.fastDelivery || f.topRated || f.offers;
