import { FULL_FEED } from '../../features/home/feed/feed.mocks';
import { HomeFeedItem } from '../../features/home/feed/feed.types';
import { apiClient } from './client';

// API Response Structure matching contract
export interface FeedResponse {
    status: 'success' | 'error';
    data: {
        feed: HomeFeedItem[];
        meta: {
            hasMore: boolean;
            nextCursor?: string;
        };
    };
}

export interface ShopCategory {
    id: string;
    title: string;
    imageUrl: string | null;
    tags: string[];
}

export interface HealthArticleDto {
    id: string;
    title: string;
    category?: string;
    readTime?: string;
    author?: string;
    imageUrl?: string;
    content?: string;
}

// Config for Development
const USE_MOCK = false;
const MOCK_DELAY = 800; // Simulate network latency

export const feedApi = {
    getHomeFeed: async (limit: number = 10, cursor?: string, lat?: number, long?: number): Promise<FeedResponse> => {
        if (USE_MOCK) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    // Simulate server-side pagination
                    const startIndex = cursor ? parseInt(cursor) : 0;
                    const items = FULL_FEED.slice(startIndex, startIndex + limit);
                    const nextIndex = startIndex + limit;
                    const hasMore = nextIndex < FULL_FEED.length;

                    resolve({
                        status: 'success',
                        data: {
                            feed: items,
                            meta: {
                                hasMore,
                                nextCursor: hasMore ? nextIndex.toString() : undefined
                            }
                        }
                    });
                }, MOCK_DELAY);
            });
        }

        // Actual API Call - lat/long (same convention as
        // customerController.getNearbyStores) drive homeController's
        // "is a pharmacy within range" check, gating whether the feed shows
        // medicine content or a "not in your area yet" fallback.
        const response = await apiClient.get<any>('/api/v1/home/feed', {
            params: { limit, cursor, lat, long }
        });

        // Normalize response to match FeedResponse interface
        // Backend now returns { data: { feed: [], meta: {} } }
        const result = response.data.data;
        const feedItems = Array.isArray(result?.feed) ? result.feed : [];
        const meta = result?.meta || { hasMore: false, nextCursor: undefined };

        return {
            status: 'success',
            data: {
                feed: feedItems,
                meta: meta
            }
        };
    },

    // Same admin-managed category list as the home feed's "Shop by
    // Category" row, fetched standalone for screens (Search) that need it
    // without loading the whole paginated home feed.
    // lat/long let the backend apply the same serviceability check
    // getHomeFeed's own CATEGORY_ROW uses - without it, the Search screen
    // kept showing "Browse by Category" (and letting the user tap into a
    // medicine search that can never fulfil) even when the home feed had
    // already determined there's no pharmacy nearby.
    getShopCategories: async (latitude?: number, longitude?: number): Promise<ShopCategory[]> => {
        const response = await apiClient.get<{ status: string; data: ShopCategory[] }>('/api/v1/home/shop-categories', {
            params: { lat: latitude, long: longitude },
        });
        return Array.isArray(response.data?.data) ? response.data.data : [];
    },

    // Full Health Knowledge Hub list for the "See All" screen - the home
    // feed's HEALTH_ARTICLE_SHOWCASE only ever carries the top 3.
    getHealthArticles: async (): Promise<HealthArticleDto[]> => {
        const response = await apiClient.get<{ status: string; data: HealthArticleDto[] }>('/api/v1/home/health-articles');
        return Array.isArray(response.data?.data) ? response.data.data : [];
    }
};
