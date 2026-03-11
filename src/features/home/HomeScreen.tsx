import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, RefreshControl, View, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeHeader from './components/HomeHeader';
import HomeFeedRenderer from './feed/HomeFeedRenderer';

import HealthSummarySkeleton from './skeletons/HealthSummarySkeleton';
import HomeFeedSkeleton from './skeletons/HomeFeedSkeleton';
import QuickActionsSkeleton from './skeletons/QuickActionsSkeleton';
import ServicesSkeleton from './skeletons/ServicesSkeleton';
import UpcomingSkeleton from './skeletons/UpcomingSkeleton';

import { AppDispatch, RootState } from '../../redux/store';
import { setHomeBootstrapped, setPrescriptionModalVisible } from '../../redux/slices/appSlice';
import { loadCalendarData } from '../../redux/slices/calendarSlice';
import { uploadPrescription } from '@/src/services/api/prescription.api';
import StatusModal, { StatusType } from '../../components/modals/StatusModal';
import { DynamicHeaderFeedItem } from './feed/feed.types';
import { useFeedActionExecutor } from './hooks/useFeedActionExecutor';
import { useHomeFeed } from './hooks/useHomeFeed';
import PrescriptionUploadModal from '../../components/modals/PrescriptionUploadModal';

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
  const [refreshing, setRefreshing] = useState(false);

  // Hook for feed actions
  const { executeAction } = useFeedActionExecutor();

  // Hook for feed data
  const { data: feedData, loading: feedLoading, loadMore, refresh: refreshFeed } = useHomeFeed();

  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollValueRef = useRef(0);
  const contentFade = useRef(new Animated.Value(0)).current;

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

  /* ------------------ LOCATION (SOURCE OF TRUTH) ------------------ */

  const selectedAddress = useSelector(
    (state: RootState) => state.address.selectedAddress,
  );

  const currentLocation = useSelector(
    (state: RootState) => state.location.currentLocation,
  );

  const lat = selectedAddress?.latitude ?? currentLocation?.latitude;
  const long = selectedAddress?.longitude ?? currentLocation?.longitude;

  /* ------------------ PRESCRIPTION UPLOAD ------------------ */

  const [isUploading, setIsUploading] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    visible: boolean;
    status: StatusType;
    title?: string;
    message?: string;
  }>({
    visible: false,
    status: 'idle',
  });

  const handlePrescriptionUpload = async (image: any) => {
    // Robustly extract coordinates
    const finalLat = selectedAddress?.latitude ?? currentLocation?.latitude;
    const finalLong = selectedAddress?.longitude ?? currentLocation?.longitude;

    console.log("📤 Home Prescription Upload - Final Coordinates:", { finalLat, finalLong });

    if (finalLat === undefined || finalLong === undefined || finalLat === null || finalLong === null) {
      setStatusModal({
        visible: true,
        status: 'error',
        title: 'Location Error',
        message: 'Location not found. Please ensure you have an address selected or location services enabled.',
      });
      return;
    }

    setIsUploading(true);
    setStatusModal({
      visible: true,
      status: 'loading',
      message: 'Uploading prescription...',
    });

    try {
      await uploadPrescription({
        prescriptionImage: image,
        latitude: finalLat,
        longitude: finalLong,
      });

      setStatusModal({
        visible: true,
        status: 'success',
        title: 'Success',
        message: 'Prescription uploaded successfully!',
      });
    } catch (e) {
      console.error('Failed to upload prescription', e);
      setStatusModal({
        visible: true,
        status: 'error',
        title: 'Upload Failed',
        message: 'Failed to upload prescription. Please try again.',
      });
    } finally {
      setIsUploading(false);
      dispatch(setPrescriptionModalVisible(false));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {isFocused && (
        <StatusBar
          translucent
          style={darkStatusBar ? 'dark' : 'light'}
          backgroundColor="transparent"
        />
      )}

      {/* Smooth continuous fading white background behind the status bar */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: insets.top,
          backgroundColor: '#ffffff',
          opacity: scrollY.interpolate({
            inputRange: [HEADER_MAX_HEIGHT - 30, HEADER_MAX_HEIGHT + 10],
            outputRange: [0, 1],
            extrapolate: 'clamp',
          }),
          zIndex: 20,
        }}
      />

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
        onEndReachedThreshold={1.5}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={15}
        decelerationRate={Platform.OS === 'ios' ? 0.992 : 'fast'}
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

      <PrescriptionUploadModal
        visible={useSelector((state: RootState) => state.app.prescriptionModalVisible)}
        isLoading={isUploading}
        onClose={() => !isUploading && dispatch(setPrescriptionModalVisible(false))}
        onImageSelected={handlePrescriptionUpload}
        existingPrescriptions={[
          {
            id: 'RX001',
            doctorName: 'Dr. Rajesh Kumar',
            prescriptionDate: '2025-01-15',
            items: 3,
            diagnosis: 'Common Cold & Fever',
          },
        ]}
      />

      <StatusModal
        visible={statusModal.visible}
        status={statusModal.status}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => setStatusModal((prev) => ({ ...prev, visible: false }))}
        autoCloseDelay={statusModal.status === 'success' ? 3000 : undefined}
      />
    </View>
  );
}
