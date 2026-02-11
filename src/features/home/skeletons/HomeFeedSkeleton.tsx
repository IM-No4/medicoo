import React from 'react';
import SkeletonBlock from '../../../components/loaders/SkeletonBlock';

export default function HomeFeedSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <SkeletonBlock
          key={i}
          height={80}
          borderRadius={16}
          style={{
            marginHorizontal: 16,
            marginBottom: 28,
          }}
        />
      ))}
    </>
  );
}
