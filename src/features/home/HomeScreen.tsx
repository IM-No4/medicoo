import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  RefreshControl,
  View,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Bot } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { executeAction as runGlobalAction } from '../../actions/ActionExecutor';
import MultiStoreCartBar from '../../components/cart/MultiStoreCartBar';
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
import { selectActiveGoals } from '../../redux/slices/goalsSlice';
import { getMedicinePrescriptions, uploadPrescription } from '@/src/services/api/prescription.api';
import StatusModal, { StatusType } from '../../components/modals/StatusModal';
import { DynamicHeaderFeedItem } from './feed/feed.types';
import { useFeedActionExecutor } from './hooks/useFeedActionExecutor';
import { getLocalDateString } from '../../utils/dateUtils';
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

const HEADER_MAX_HEIGHT = 136;
const FADE_DURATION = 180;

type Props = {
  onOpenCommandPalette: () => void;
};

export default function HomeScreen({ onOpenCommandPalette }: Props) {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);

  // Hook for feed actions
  const { executeAction } = useFeedActionExecutor();

  // Hook for feed data
  const { data: feedData, loading: feedLoading, loadMore, refresh: refreshFeed } = useHomeFeed();

  // Used to lift the Medo FAB above MultiStoreCartBar when it's showing,
  // instead of the two overlapping.
  const carts = useSelector((state: RootState) => state.cart);
  const hasCartItems = useMemo(
    () => Object.values(carts).some((storeCart: any) => Object.keys(storeCart.items).length > 0),
    [carts]
  );

  // Only show goals section if there are active goals
  const activeGoals = useSelector(selectActiveGoals);
  const hasActiveGoals = activeGoals.length > 0;

  // Load tracked in-progress activity from Redux (backed by AsyncStorage)
  const trackedActivity = useSelector((state: RootState) => state.activity?.activity ?? null);

  // Filter out showcases of features not in area yet (Lab, Hospital, Home Care showcases)
  const visibleFeedData = useMemo(() => {
    const filtered = feedData.filter(
      (item) =>
        item.type !== 'LAB_PACKAGE_SHOWCASE' &&
        item.type !== 'HOSPITAL_SHOWCASE' &&
        item.type !== 'HOME_CARE_SHOWCASE' &&
        item.type !== 'CONTINUE_ACTIVITY' // always exclude any static mock
    );

    // Dynamically inject CONTINUE_ACTIVITY right after QUICK_ACTIONS when there's a tracked activity
    let result = [...filtered];
    if (trackedActivity) {
      const quickActionsIndex = result.findIndex(item => item.type === 'QUICK_ACTIONS');
      const insertAt = quickActionsIndex !== -1 ? quickActionsIndex + 1 : 0;
      result.splice(insertAt, 0, {
        id: 'dynamic_continue_activity',
        type: 'CONTINUE_ACTIVITY',
        title: trackedActivity.title,
        subtitle: trackedActivity.subtitle,
        ctaText: 'Resume',
        icon: trackedActivity.icon,
        progress: trackedActivity.progress,
        actionIdentifier: trackedActivity.id,
        // Pass navigation target via action field
        action: {
          type: 'NAVIGATE',
          stack: trackedActivity.stack,
          screen: trackedActivity.screen,
          params: trackedActivity.params,
        },
      } as any);
    }

    // Upcoming appointments card - always inserted right after Services,
    // regardless of whether the backend feed has anything there yet; the
    // card itself renders nothing if there's nothing upcoming to show.
    const servicesIndex = result.findIndex(item => item.type === 'SERVICES_SECTION');
    result.splice(servicesIndex !== -1 ? servicesIndex + 1 : result.length, 0, {
      id: 'virtual_upcoming_appointments',
      type: 'UPCOMING_APPOINTMENTS_CARD'
    } as any);

    // Only inject Goals section when user has created active goals
    if (hasActiveGoals) {
      const summaryIndex = result.findIndex(item => item.type === 'HEALTH_SUMMARY');
      if (summaryIndex !== -1) {
        const insertIndex = Math.min(result.length, summaryIndex + 2);
        result.splice(insertIndex, 0, {
          id: 'virtual_goals_card',
          type: 'GOALS_SECTION'
        } as any);
      }
    }

    return result;
  }, [feedData, hasActiveGoals, trackedActivity]);

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
    dispatch(loadCalendarData(getLocalDateString()));
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
      dispatch(loadCalendarData(getLocalDateString()));
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
  const isPrescriptionModalVisible = useSelector(
    (state: RootState) => state.app.prescriptionModalVisible
  );

  // "Recent Prescriptions" in the modal below used to be a single
  // hardcoded fake entry with no working tap handler at all - fetched here
  // (real doctor-issued records) whenever the modal opens, and kept
  // alongside its raw source so selecting one can look up its medicines.
  const [existingPrescriptions, setExistingPrescriptions] = useState<any[]>([]);
  useEffect(() => {
    if (!isPrescriptionModalVisible) return;
    getMedicinePrescriptions()
      .then(setExistingPrescriptions)
      .catch((e) => console.warn('Failed to load existing prescriptions', e));
  }, [isPrescriptionModalVisible]);

  const handleSelectExistingPrescription = (prescriptionId: string) => {
    const prescription = existingPrescriptions.find((p) => p._id === prescriptionId);
    const firstMedicineName = prescription?.prescribedMedicines?.[0]?.medicineName;
    dispatch(setPrescriptionModalVisible(false));
    if (firstMedicineName) {
      runGlobalAction('OPEN_GLOBAL_SEARCH', { query: firstMedicineName });
    }
  };

  const [statusModal, setStatusModal] = useState<{
    visible: boolean;
    status: StatusType;
    title?: string;
    message?: string;
    primaryAction?: () => void;
    primaryActionText?: string;
  }>({
    visible: false,
    status: 'idle',
  });

  const handlePrescriptionUpload = async (image: any) => {
    // Robustly extract coordinates
    const finalLat = selectedAddress?.latitude ?? currentLocation?.latitude;
    const finalLong = selectedAddress?.longitude ?? currentLocation?.longitude;

    if (finalLat === undefined || finalLong === undefined || finalLat === null || finalLong === null) {
      setStatusModal({
        visible: true,
        status: 'error',
        title: 'Location Error',
        message: 'Location not found. Please ensure you have an address selected or location services enabled.',
      });
      return;
    }

    // Immediately navigate to Analysis screen which will handle the upload and display results/loading
    dispatch(setPrescriptionModalVisible(false));
    navigation.navigate('PharmacyStack', {
      screen: 'PrescriptionResult',
      params: { 
        image: image,
        latitude: finalLat,
        longitude: finalLong
      }
    });
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
        data={isInitialLoading ? [] : visibleFeedData}
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
          paddingTop: HEADER_HEIGHT + 12,
          // Clears the floating MultiStoreCartBar rendered below once
          // there are cart items.
          paddingBottom: 100,
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

      {/* The tab bar is always visible and already reserves its own bottom
          safe-area padding right below this - adding the real inset here
          too would double up as a visible gap. */}
      <MultiStoreCartBar bottomInset={0} />

      <TouchableOpacity
        style={{
          position: 'absolute',
          right: 16,
          bottom: hasCartItems ? 100 : 16,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#0FBBA1',
          alignItems: 'center',
          justifyContent: 'center',
          ...Platform.select({
            ios: {
              shadowColor: '#0FBBA1',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            },
            android: { elevation: 6 },
          }),
        }}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AIAssistantChat')}
      >
        <Bot size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <PrescriptionUploadModal
        visible={isPrescriptionModalVisible}
        isLoading={isUploading}
        onClose={() => !isUploading && dispatch(setPrescriptionModalVisible(false))}
        onImageSelected={handlePrescriptionUpload}
        onPrescriptionSelected={handleSelectExistingPrescription}
        existingPrescriptions={existingPrescriptions.map((p) => ({
          id: p._id,
          doctorName: p.doctorName || 'Doctor',
          prescriptionDate: p.createdAt,
          items: p.prescribedMedicines?.length || 0,
        }))}
      />

      <StatusModal
        visible={statusModal.visible}
        status={statusModal.status}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => setStatusModal((prev) => ({ ...prev, visible: false }))}
        primaryAction={statusModal.primaryAction}
        primaryActionText={statusModal.primaryActionText}
        autoCloseDelay={statusModal.status === 'success' && !statusModal.primaryAction ? 3000 : undefined}
      />
    </View>
  );
}
