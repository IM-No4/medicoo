import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { feedApi } from '../../../services/api/feed.api';
import { RootState } from '../../../redux/store';
import { HomeFeedItem } from '../feed/feed.types';

// The feed arrives in pages (the backend cuts it by section). The first page is only what fills the first screen or two, so the home screen
// appears quickly; the rest is fetched in the background before the person scrolls to it (see the read-ahead below and the list's
// onEndReachedThreshold), so scrolling never waits on the network and never shows a jump.
const BATCH_SIZE = 6;
const INITIAL_BATCH_SIZE = 8;
// A page can come back with no sections to show (their content is empty for this customer). The list would not grow, so it would never ask
// for the next page and the feed would seem to end early: keep going to the next page instead, a few times at most.
const MAX_EMPTY_PAGES = 3;
// How long after the first page has been drawn before the second is fetched quietly.
const READ_AHEAD_DELAY_MS = 900;

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
    // the ids already on screen, readable inside a load that is still running (state would be a render behind)
    const knownIdsRef = useRef<Set<string>>(new Set());
    const readAheadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const loadMoreRef = useRef<() => void>(() => undefined);

    // What the feed depends on, read at the moment a request starts and compared while one is running. On a fresh install the address is
    // found AFTER the first request has gone out (the person is still answering the location permission), and that request came back with
    // the "no pharmacy here yet" feed: header and footer only. The reload for the real location arrived while that request was still
    // running, was dropped by the "already loading" guard, and nothing ever asked again. Now a change of inputs during a load discards that
    // load's answer and starts a fresh one with the new location as soon as it ends.
    const inputsKey = `${latitude},${longitude},${resumeSignal}`;
    const inputsKeyRef = useRef(inputsKey);
    inputsKeyRef.current = inputsKey;
    const coordsRef = useRef({ latitude, longitude });
    coordsRef.current = { latitude, longitude };
    const inFlightKeyRef = useRef<string | null>(null);
    const generationRef = useRef(0);
    const pendingResetRef = useRef(false);
    const loadFeedRef = useRef<(reset?: boolean) => Promise<void>>(async () => undefined);

    const loadFeed = useCallback(async (reset = false): Promise<void> => {
        if (loadingRef.current) {
            // a reset asked for while a load is running: only worth redoing if what it depends on has changed since that load began (the
            // mount effects below all ask at once, with identical inputs, and those duplicates are meant to be dropped)
            if (reset && inFlightKeyRef.current !== null && inFlightKeyRef.current !== inputsKeyRef.current) {
                pendingResetRef.current = true;
                generationRef.current += 1;
            }
            return;
        }
        if (!reset && !hasMore) return;
        if (!isOnline) return;
        // The feed is location-based: it is not requested until the customer's location is known (HomeScreen shows only the header, then the
        // feed once the location is found, or the "allow location" card if it was refused). Asking without one used to return a feed built for
        // nobody in particular. The effect below reloads as soon as coordinates arrive.
        if (typeof coordsRef.current.latitude !== 'number' || typeof coordsRef.current.longitude !== 'number') return;

        loadingRef.current = true;
        inFlightKeyRef.current = inputsKeyRef.current;
        const myGeneration = generationRef.current;
        const { latitude: requestLat, longitude: requestLong } = coordsRef.current;
        setLoading(true);

        try {
            let cursorToUse = reset ? undefined : nextCursor;
            let isFirstPage = true;
            let finalHasMore = hasMore;

            for (let emptyPages = 0; emptyPages <= MAX_EMPTY_PAGES; emptyPages += 1) {
                const limit = reset && isFirstPage ? INITIAL_BATCH_SIZE : BATCH_SIZE;
                // eslint-disable-next-line no-await-in-loop
                const response = await feedApi.getHomeFeed(limit, cursorToUse, requestLat, requestLong);
                // the inputs changed while this was on its way: its answer is for the old location, drop it (the reload below replaces it)
                if (myGeneration !== generationRef.current) return;
                if (response.status !== 'success') break;
                const { feed, meta } = response.data;

                let added: HomeFeedItem[];
                if (reset && isFirstPage) {
                    knownIdsRef.current = new Set(feed.map(item => item.id));
                    added = feed;
                    setData(feed);
                } else {
                    // Prevent duplicate items if API returns them
                    added = feed.filter(item => !knownIdsRef.current.has(item.id));
                    added.forEach(item => knownIdsRef.current.add(item.id));
                    if (added.length > 0) setData(prev => [...prev, ...added]);
                }

                finalHasMore = meta.hasMore;
                setHasMore(meta.hasMore);
                setNextCursor(meta.nextCursor);
                cursorToUse = meta.nextCursor;
                isFirstPage = false;
                if (added.length > 0 || !meta.hasMore) break;
            }

            // read-ahead: once the first page is on screen, quietly fetch the second so it is already there when the person scrolls down
            if (reset && finalHasMore) {
                if (readAheadTimerRef.current) clearTimeout(readAheadTimerRef.current);
                readAheadTimerRef.current = setTimeout(() => loadMoreRef.current(), READ_AHEAD_DELAY_MS);
            }
        } catch (error) {
            console.error('Failed to fetch home feed:', error);
        } finally {
            loadingRef.current = false;
            inFlightKeyRef.current = null;
            if (pendingResetRef.current) {
                // start the reload straight away, without letting the loading flag drop in between (no flash of an empty feed)
                pendingResetRef.current = false;
                setTimeout(() => { loadFeedRef.current(true); }, 0);
            } else {
                setLoading(false);
                if (reset) setIsRefreshing(false);
            }
        }
    }, [hasMore, nextCursor, isOnline]);
    loadFeedRef.current = loadFeed;

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

    loadMoreRef.current = loadMore;
    useEffect(() => () => {
        if (readAheadTimerRef.current) clearTimeout(readAheadTimerRef.current);
    }, []);

    return {
        data,
        loading,
        hasMore,
        loadMore,
        refresh,
        isRefreshing
    };
}
