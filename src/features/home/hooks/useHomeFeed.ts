import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { feedApi } from '../../../services/api/feed.api';
import { RootState } from '../../../redux/store';
import { HomeFeedItem } from '../feed/feed.types';

// User requested at least 6 sections initially
const BATCH_SIZE = 6;
const INITIAL_BATCH_SIZE = 14;

export function useHomeFeed() {
    const [data, setData] = useState<HomeFeedItem[]>([]);
    const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Drives homeController's "is a pharmacy within range" check - read
    // directly from redux rather than threaded through as a param, since
    // HomeHeader.tsx already owns resolving/selecting this independently
    // (saved address, or a reverse-geocoded current location) and every
    // caller of this hook wants the same behavior.
    const selectedAddress = useSelector((state: RootState) => state.address.selectedAddress);
    const latitude = selectedAddress?.latitude;
    const longitude = selectedAddress?.longitude;

    // This feed has no offline cache/fallback at all - it's a live, paginated,
    // location-aware, backend-composed screen. There's no stale copy worth
    // showing, so while offline HomeScreen renders OfflineHomeContent
    // instead and this hook just doesn't bother making a request that's
    // guaranteed to fail (avoids the console noise and wasted retry, not
    // just a cosmetic no-op).
    const isOnline = useSelector((state: RootState) => state.connectivity.isOnline);

    // Bumped by offlineSync.ts whenever the app returns from sitting
    // backgrounded for a while (BACKGROUND_REFRESH_THRESHOLD_MS) - the feed
    // is exactly the kind of content (prices, stock, promos, appointment
    // reminders) that can go stale while the user was away and isn't
    // covered by anything else already reacting to that resume.
    const resumeSignal = useSelector((state: RootState) => state.appLifecycle.resumeSignal);

    // Use a ref to prevent race conditions or duplicate calls
    const loadingRef = useRef(false);

    const loadFeed = useCallback(async (reset = false) => {
        if (loadingRef.current) return;
        if (!reset && !hasMore) return;
        if (!isOnline) return;

        loadingRef.current = true;
        setLoading(true);

        try {
            const cursorToUse = reset ? undefined : nextCursor;
            const limit = reset ? INITIAL_BATCH_SIZE : BATCH_SIZE;
            const response = await feedApi.getHomeFeed(limit, cursorToUse, latitude, longitude);

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
    }, [hasMore, nextCursor, latitude, longitude, isOnline]);

    // Initial load
    useEffect(() => {
        loadFeed(true);
        // Deliberately NOT depending on latitude/longitude here (that's the
        // separate effect below) - this must fire exactly once on mount,
        // location known or not, so the feed never sits blank waiting on
        // HomeHeader's own async address resolution.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // HomeHeader resolves the selected address asynchronously after its own
    // mount (saved-address lookup, then GPS + reverse geocode) - by the time
    // that resolves, the initial load above has very likely already fired
    // without coordinates. Reloading on every change (not just the first,
    // as this used to be gated by a hadCoordsRef one-shot guard) also
    // covers the user picking a different saved address later - the feed's
    // serviceability/location-scoped content needs to reflect that, not
    // keep showing whatever the previous address's fetch decided.
    // Deliberately NOT depending on loadFeed here (only the coordinates) -
    // loadFeed's own identity changes after every successful fetch (its
    // useCallback deps include hasMore/nextCursor), so including it would
    // re-trigger this effect after every load and loop forever. Safe to
    // fire alongside the mount-effect above regardless: loadFeed's
    // loadingRef guard is set synchronously before any await, so if both
    // effects run in the same commit, the second call bails out instead of
    // firing a duplicate request.
    useEffect(() => {
        loadFeed(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [latitude, longitude]);

    // Reload on a stale-length resume (offlineSync.ts) - same reasoning/
    // guard against loadFeed's own changing identity as the effect above.
    // Also fires harmlessly on mount (resumeSignal's initial value), same
    // as that one - loadFeed's loadingRef guard dedupes it against the
    // mount effect's own call.
    useEffect(() => {
        loadFeed(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resumeSignal]);

    // Reload once connectivity comes back - the initial-mount load above
    // either never ran (loadFeed bails out while offline) or ran and failed,
    // so there's nothing here for a reconnect to silently "just work" on
    // its own the way the offline-capable slices (vitals/goals/steps) do.
    const wasOfflineRef = useRef(false);
    useEffect(() => {
        if (!isOnline) {
            wasOfflineRef.current = true;
        } else if (wasOfflineRef.current) {
            wasOfflineRef.current = false;
            loadFeed(true);
        }
    }, [isOnline, loadFeed]);

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
