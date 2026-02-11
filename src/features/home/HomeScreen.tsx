import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import HomeHeader from './components/HomeHeader';
import HomeFeedRenderer from './feed/HomeFeedRenderer';

import HealthSummarySkeleton from './skeletons/HealthSummarySkeleton';
import HomeFeedSkeleton from './skeletons/HomeFeedSkeleton';
import QuickActionsSkeleton from './skeletons/QuickActionsSkeleton';
import ServicesSkeleton from './skeletons/ServicesSkeleton';
import UpcomingSkeleton from './skeletons/UpcomingSkeleton';

import { useNavigation } from '@react-navigation/native';
import { setHomeBootstrapped } from '../../redux/slices/appSlice';
import { loadCalendarData } from '../../redux/slices/calendarSlice';
import { AppDispatch, RootState } from '../../redux/store';
import { DynamicHeaderFeedItem } from './feed/feed.types';
import { useFeedActionExecutor } from './hooks/useFeedActionExecutor';
import { useHomeFeed } from './hooks/useHomeFeed';

// Skeletons are still used for initial load
const LoadingSkeletons = () => (
  <View>
    <QuickActionsSkeleton />
    <ServicesSkeleton />
    <UpcomingSkeleton />
    <HealthSummarySkeleton />
  </View>
);

const HEADER_MAX_HEIGHT = 160;
const FADE_DURATION = 180;

type Props = {
  onOpenCommandPalette: () => void;
};

export default function HomeScreen({ onOpenCommandPalette }: Props) {
  const navigation = useNavigation<any>();
  const [uploadVisible, setUploadVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Hook for feed actions
  const { executeAction } = useFeedActionExecutor();

  // Hook for feed data
  const { data: feedData, loading: feedLoading, hasMore, loadMore, refresh: refreshFeed } = useHomeFeed();

  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollValueRef = useRef(0);
  const contentFade = useRef(new Animated.Value(0)).current;

  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();

  const HEADER_HEIGHT = HEADER_MAX_HEIGHT + insets.top;

  const [darkStatusBar, setDarkStatusBar] = useState(false);
  const lastStatusRef = useRef(false);

  const homeBootstrapped = useSelector(
    (state: RootState) => state.app.homeBootstrapped
  );

  // Combined loading state: App bootstrap OR Feed initial load (if data is empty)
  // We use feedLoading && feedData.length === 0 to denote "Waiting for first batch"
  const isInitialLoading = !homeBootstrapped || (feedLoading && feedData.length === 0);

  useFocusEffect(
    useCallback(() => {
      const shouldBeDark = scrollValueRef.current > HEADER_MAX_HEIGHT;
      setDarkStatusBar(shouldBeDark);
      lastStatusRef.current = shouldBeDark;
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const today = new Date().toISOString().split('T')[0];
    dispatch(loadCalendarData(today));
    await refreshFeed();
    setRefreshing(false);
  }, [dispatch, refreshFeed]);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      scrollValueRef.current = value;
      const shouldBeDark = value > HEADER_MAX_HEIGHT;

      if (lastStatusRef.current !== shouldBeDark) {
        lastStatusRef.current = shouldBeDark;
        setDarkStatusBar(shouldBeDark);
      }
    });

    return () => scrollY.removeListener(id);
  }, [scrollY]);

  useEffect(() => {
    if (!homeBootstrapped) {
      const timer = setTimeout(() => {
        dispatch(setHomeBootstrapped());

        Animated.timing(contentFade, {
          toValue: 1,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }).start();
      }, 500);

      return () => clearTimeout(timer);
    } else {
      contentFade.setValue(1);
    }
  }, [homeBootstrapped, dispatch, contentFade]);

  // Select calendar data
  const { data: calendarData } = useSelector((state: RootState) => state.calendar);

  // Fetch today's data on mount/focus
  useFocusEffect(
    useCallback(() => {
      const today = new Date().toISOString().split('T')[0];
      dispatch(loadCalendarData(today));
    }, [dispatch])
  );

  const renderFooter = useCallback(() => {
    if (feedLoading && !isInitialLoading) {
      return (
        <View style={{ paddingVertical: 10 }}>
          <HomeFeedSkeleton />
        </View>
      );
    }
    return null;
  }, [feedLoading, isInitialLoading]);

  // Manual isFocused tracking since useIsFocused is causing issues
  const [isFocused, setIsFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  // Extract dynamic header config if it exists in the first batch
  const dynamicHeaderConfig = useMemo(() => {
    return feedData.find(item => item.type === 'DYNAMIC_HEADER') as DynamicHeaderFeedItem | undefined;
  }, [feedData]);

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {isFocused && (
        <StatusBar
          translucent
          style={darkStatusBar ? 'dark' : 'light'}
          backgroundColor={darkStatusBar ? '#ffffff' : 'transparent'}
        />
      )}

      {darkStatusBar && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: insets.top,
            backgroundColor: '#ffffff',
            zIndex: 20,
          }}
        />
      )}

      <HomeHeader
        scrollY={scrollY}
        maxHeight={HEADER_MAX_HEIGHT}
        onOpenCommandPalette={onOpenCommandPalette}
        dynamicConfig={dynamicHeaderConfig}
      />

      <Animated.FlatList
        data={isInitialLoading ? [] : feedData}
        extraData={useSelector((state: RootState) => state.cart)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HomeFeedRenderer item={item} onAction={executeAction} />
        )}
        ListHeaderComponent={isInitialLoading ? LoadingSkeletons : null}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.2}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={11}
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: HEADER_HEIGHT + 28,
          paddingBottom: 0,
        }}
        scrollEventThrottle={8}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            progressViewOffset={HEADER_HEIGHT + 20}
          />
        }
      />
    </View>
  );
}
