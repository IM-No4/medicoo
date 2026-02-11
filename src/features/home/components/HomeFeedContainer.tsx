import React, { useEffect, useRef } from 'react';
import { Animated, FlatList } from 'react-native';
import HomeFeedRenderer from '../feed/HomeFeedRenderer';
import { useFeedActionExecutor } from '../hooks/useFeedActionExecutor';
import { useHomeFeed } from '../hooks/useHomeFeed';
import HomeFeedSkeleton from '../skeletons/HomeFeedSkeleton';
import HomeFeedFooter from './HomeFeedFooter';

const FADE_DURATION = 180;

type Props = {
  refreshing?: boolean;
};

export default function HomeFeedContainer({ refreshing }: Props) {
  const { data, loading, refresh } = useHomeFeed();
  const { executeAction } = useFeedActionExecutor();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Sync refresh from props if needed
  useEffect(() => {
    if (refreshing) {
      refresh();
    }
  }, [refreshing, refresh]);

  useEffect(() => {
    if (data.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }).start();
    }
  }, [data, fadeAnim]);

  // Cold start → skeleton
  if (loading && data.length === 0) {
    return <HomeFeedSkeleton />;
  }

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <FlatList
        data={data}
        renderItem={({ item }) => (
          <HomeFeedRenderer item={item} onAction={executeAction} />
        )}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        removeClippedSubviews
        initialNumToRender={3}
        ListFooterComponent={
          <HomeFeedFooter
            appName="Medicoo"
            tagline="Your Health, Our Priority"
          />
        }
      />
    </Animated.View>
  );
}
