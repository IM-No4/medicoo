import React from 'react';
import { View } from 'react-native';
import SectionWrapper from '../components/SectionWrapper';
import HomeFeedRenderer from './HomeFeedRenderer';
import { HomeFeedItem } from './feed.types';

const FEED_DATA: HomeFeedItem[] = [
  {
    id: 'promo-1',
    type: 'PROMO',
    title: '20% off on medicines',
    subtitle: 'Valid till tonight',
  },
  {
    id: 'tip-1',
    type: 'HEALTH_TIP',
    text: 'Drink at least 8 glasses of water today',
  },
  {
    id: 'reminder-1',
    type: 'REMINDER',
    label: 'Blood pressure check',
    time: '6:00 PM',
  },
];

export default function HomeFeed() {
  return (
    <SectionWrapper title="For You">
      <View style={{ gap: 12 }}>
        {FEED_DATA.map(item => (
          <HomeFeedRenderer key={item.id} item={item} />
        ))}
      </View>
    </SectionWrapper>
  );
}
