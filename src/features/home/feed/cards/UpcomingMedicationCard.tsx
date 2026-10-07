import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store';
import { markMedicineIntake } from '../../../../redux/slices/calendarSlice';
import { getLocalDateString } from '../../../../utils/dateUtils';
import { timeToMinutes } from '../../../calendar/utils/scheduleSort';
import MedicineCard from '../../../calendar/components/MedicineCard';
import { UpcomingMedicationFeedItem } from '../feed.types';

type Props = {
  data: UpcomingMedicationFeedItem;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const SIDE_PADDING = 20;

// Admin-toggleable (HomeFeedConfig sectionType: 'UPCOMING_MEDICATION') -
// the backend feed item only carries title/subtitle (see
// homeController.js's matching case); the actual schedule is read straight
// from the calendar redux slice, same source and same interactive
// Taken/Skipped behavior as OfflineHomeContent.tsx's own "Today's
// Medications" section, so it can't drift out of sync with whatever's
// already been marked since the feed itself last loaded.
// A 3-copy-plus-silent-reset loop (the first version of this) had a
// visible blink whenever the reset actually fired - the JS-thread
// scrollToOffset jump and the native scroll view's own settled position
// briefly disagreed, showing a one-frame flash right as it wrapped back to
// the first item. Using a large enough virtual buffer instead means that
// reset never has to happen at all for any realistic amount of swiping, so
// there's nothing left to blink.
const LOOP_COPIES = 50;

function UpcomingMedicationCard({ data }: Props) {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const [activeIndex, setActiveIndex] = useState(0);

  const todaysMedicines = useSelector((state: RootState) => state.calendar.data.medicines) ?? [];
  // "Upcoming" - once a dose has actually been logged (taken or skipped)
  // there's nothing left to act on, so it drops out of this stack rather
  // than sticking around as a completed entry (ManageMedicationsScreen and
  // the Calendar tab remain the place to see the full day's history).
  const sortedMedicines = todaysMedicines
    .filter((m: any) => m.status !== 'taken' && m.status !== 'skipped')
    .sort((a: any, b: any) => timeToMinutes(a.time) - timeToMinutes(b.time));
  const todayStr = getLocalDateString();
  const count = sortedMedicines.length;

  // Nothing left to log - the whole section (header included) disappears
  // rather than showing an empty "0 medications" state.
  if (count === 0) return null;

  const loopData = count > 1
    ? Array.from({ length: count * LOOP_COPIES }, (_, i) => sortedMedicines[i % count])
    : sortedMedicines;
  const initialIndex = count > 1 ? Math.floor(LOOP_COPIES / 2) * count : 0;

  const renderCard = (item: any) => (
    <MedicineCard
      key={item.id}
      scheduleId={item.id.split('_')[0]}
      date={todayStr}
      name={item.title}
      dosage={item.subtitle}
      time={item.time}
      status={item.status}
      shape={item.shape}
      color={item.color}
      leftColor={item.leftColor}
      rightColor={item.rightColor}
      isFuture={false}
      // MedicineCard's own border matches the Calendar tab's card language
      // (#E5E7EB, radius 20) - here it sits among the home feed's other
      // cards, which all use a lighter, smaller-radius border instead
      // (see peekCard below, and HealthSummary.tsx/HealthArticleCard.tsx).
      style={styles.medicineCardBorder}
      onMarkIntake={(status) => {
        dispatch(markMedicineIntake({
          scheduleId: item.id.split('_')[0],
          date: todayStr,
          time: item.time,
          status,
        }));
      }}
    />
  );

  const onMomentumScrollEnd = (event: any) => {
    const rawIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    const normalized = ((rawIndex % count) + count) % count;
    if (normalized !== activeIndex) {
      setActiveIndex(normalized);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerRow, { paddingHorizontal: SIDE_PADDING }]}>
        <Text style={styles.title}>
          {(data.title || 'Upcoming Medications').toUpperCase()}
          {/* Clamped since the list can shrink out from under activeIndex
              the instant a dose is marked taken/skipped and drops out of
              the stack, before the user swipes again to re-sync it. */}
          {count > 1 ? ` · ${Math.min(activeIndex, count - 1) + 1} OF ${count}` : ''}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('ManageMedications')}>
          <Text style={styles.seeAll}>View All</Text>
        </TouchableOpacity>
      </View>

      {sortedMedicines.length === 1 ? (
        <View style={{ paddingHorizontal: SIDE_PADDING }}>{renderCard(sortedMedicines[0])}</View>
      ) : (
        <View style={styles.stackArea}>
          {/* Two static "peek" cards behind the swipeable one - purely
              visual, gives the deck depth without needing a second real
              MedicineCard rendered per layer. */}
          <View style={[styles.peekCard, styles.peekCardBack]} />
          <View style={[styles.peekCard, styles.peekCardMid]} />

          {/* pagingEnabled alone (no snapToInterval/contentContainerStyle
              padding) snaps natively to whole multiples of the FlatList's
              own width - mixing that with content-container padding was
              the bug: the content starts offset by the padding amount, but
              the snap points are still computed from zero, so swipes
              landed mid-way between cards and showed two partial ones at
              once. Each page is a full-screen-width slot instead, with the
              inset applied as padding *inside* that slot. */}
          <FlatList
            data={loopData}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            initialScrollIndex={initialIndex}
            getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
            onMomentumScrollEnd={onMomentumScrollEnd}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={({ item }) => (
              <View style={{ width: SCREEN_WIDTH, paddingHorizontal: SIDE_PADDING }}>
                {renderCard(item)}
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}

export default React.memo(UpcomingMedicationCard);

const styles = StyleSheet.create({
  container: {
    // MedicineCard.tsx (rendered inside this card, single or in the
    // FlatList) already carries its own marginBottom:12 - meant for
    // spacing between siblings in its other usages (CalendarScreen,
    // OfflineHomeContent's plain vertical list). Here it's the last/only
    // visible element, so that 12px stacks with this container's own
    // margin; 18 (not 30) keeps the total gap after this card at the
    // feed's standard 30px instead of 42px.
    marginBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // Matches SectionHeader.tsx's marginBottom (the shared header used by
    // most other feed cards) instead of a slightly smaller one-off value.
    marginBottom: 16,
  },
  title: {
    fontSize: 13,
    color: '#494949',
    letterSpacing: 2,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0FBBA1',
  },
  stackArea: {
    position: 'relative',
  },
  // Feed-wide border convention (HealthSummary.tsx, HealthArticleCard.tsx,
  // ProductShowcaseCard.tsx, etc.) instead of MedicineCard's own
  // Calendar-tab-matching one - see the `style` prop passed to MedicineCard
  // above, kept in sync with this same radius/color.
  medicineCardBorder: {
    borderRadius: 16,
    borderColor: '#F1F5F9',
  },
  peekCard: {
    position: 'absolute',
    left: SIDE_PADDING + 10,
    right: SIDE_PADDING + 10,
    height: 76,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  peekCardBack: {
    top: -10,
    left: SIDE_PADDING + 18,
    right: SIDE_PADDING + 18,
    opacity: 0.5,
  },
  peekCardMid: {
    top: -5,
    opacity: 0.8,
  },
});
