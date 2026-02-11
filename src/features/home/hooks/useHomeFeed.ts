import { useCallback, useEffect, useRef, useState } from 'react';
import { feedApi } from '../../../services/api/feed.api';
import { HomeFeedItem } from '../feed/feed.types';

// User requested at least 6 sections initially
const BATCH_SIZE = 3;
const INITIAL_BATCH_SIZE = 14;

export function useHomeFeed() {
    const [data, setData] = useState<HomeFeedItem[]>([]);
    const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Use a ref to prevent race conditions or duplicate calls
    const loadingRef = useRef(false);

    const loadFeed = useCallback(async (reset = false) => {
        if (loadingRef.current) return;
        if (!reset && !hasMore) return;

        loadingRef.current = true;
        setLoading(true);

        try {
            const cursorToUse = reset ? undefined : nextCursor;
            const limit = reset ? INITIAL_BATCH_SIZE : BATCH_SIZE;
            const response = await feedApi.getHomeFeed(limit, cursorToUse);

            if (response.status === 'success') {
                const { feed, meta } = response.data;

                if (reset) {
                    setData(feed);
                } else {
                    // Prevent duplicate items if API returns them
                    setData(prev => {
                        const existingIds = new Set(prev.map(item => item.id));
                        const newUniqueItems = feed.filter(item => !existingIds.has(item.id));
                        return [...prev, ...newUniqueItems];
                    });
                }

                setHasMore(meta.hasMore);
                setNextCursor(meta.nextCursor);
            }
        } catch (error) {
            console.error('Failed to fetch home feed:', error);
        } finally {
            loadingRef.current = false;
            setLoading(false);
            if (reset) setIsRefreshing(false);
        }
    }, [hasMore, nextCursor]);

    // Initial load
    useEffect(() => {
        loadFeed(true);
    }, []);

    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        await loadFeed(true);
    }, [loadFeed]);

    const loadMore = useCallback(() => {
        // Only load more if we aren't already loading and there's more to fetch
        if (!loadingRef.current && hasMore) {
            loadFeed(false);
        }
    }, [loadFeed, hasMore]);

    return {
        data,
        loading,
        hasMore,
        loadMore,
        refresh,
        isRefreshing
    };
}
