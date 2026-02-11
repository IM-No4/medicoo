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

// Config for Development
const USE_MOCK = false;
const MOCK_DELAY = 800; // Simulate network latency

export const feedApi = {
    getHomeFeed: async (limit: number = 10, cursor?: string): Promise<FeedResponse> => {
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

        // Actual API Call
        const response = await apiClient.get<any>('api/home/feed', {
            params: { limit, cursor }
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
    }
};
