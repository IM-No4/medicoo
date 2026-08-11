import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../styles';

// Configuration
const ITEM_WIDTH = 60;
const ITEM_MARGIN = 4;
const FULL_ITEM_WIDTH = ITEM_WIDTH + (ITEM_MARGIN * 2);
const BUFFER_DAYS = 30; // Load 30 days back/forward initially

interface DateStripProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
}

export default function DateStrip({ selectedDate, onSelectDate }: DateStripProps) {
    const [dates, setDates] = useState<any[]>([]);

    const flatListRef = useRef<FlatList>(null);
    const isLoading = useRef(false);

    const createDateItem = (baseDate: Date, offset: number) => {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + offset);
        return {
            id: date.toISOString().split('T')[0],
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            dateNum: date.getDate(),
            fullDate: date,
        };
    };

    useEffect(() => {
        const today = new Date();
        const initialData = [];
        for (let i = -BUFFER_DAYS; i <= BUFFER_DAYS; i++) {
            initialData.push(createDateItem(today, i));
        }
        setDates(initialData);

        // Scroll to center exactly (Index of Today = BUFFER_DAYS)
        setTimeout(() => {
            flatListRef.current?.scrollToIndex({
                index: BUFFER_DAYS,
                animated: false,
                viewPosition: 0.5,
            });
        }, 100);
    }, []);

    const loadMoreFuture = () => {
        if (isLoading.current || dates.length === 0) return;
        isLoading.current = true;

        const lastItem = dates[dates.length - 1];
        const newDates = [];
        for (let i = 1; i <= 15; i++) {
            newDates.push(createDateItem(lastItem.fullDate, i));
        }
        setDates((prev) => [...prev, ...newDates]);
        setTimeout(() => { isLoading.current = false; }, 500);
    };

    const loadMorePast = () => {
        if (isLoading.current || dates.length === 0) return;
        isLoading.current = true;

        const firstItem = dates[0];
        const newDates = [];
        for (let i = 15; i > 0; i--) {
            newDates.push(createDateItem(firstItem.fullDate, -i));
        }
        setDates((prev) => [...newDates, ...prev]);
        setTimeout(() => { isLoading.current = false; }, 500);
    };

    /* ---------------- UPDATED RENDER ITEM ---------------- */
    const renderItem = useCallback(({ item }: any) => {
        const isSelected = item.fullDate.toDateString() === selectedDate.toDateString();
        // Check if this item is actually "Today" based on system time
        const isToday = item.fullDate.toDateString() === new Date().toDateString();

        return (
            <TouchableOpacity
                style={[
                    styles.dayItem,
                    isSelected && styles.activeDayItem,
                    // 1. Subtle border if it's today but NOT selected
                    (isToday && !isSelected) && styles.todayItemBorder,
                    // 2. NEW: Sharp border if it IS today AND IS selected
                    (isToday && isSelected) && styles.selectedTodayBorder,
                ]}
                onPress={() => onSelectDate(item.fullDate)}
                activeOpacity={0.8}
            >
                <Text style={[styles.dayLabel, isSelected && styles.activeText]}>
                    {item.day}
                </Text>
                <Text style={[styles.dateLabel, isSelected && styles.activeText]}>
                    {item.dateNum}
                </Text>
            </TouchableOpacity>
        );
    }, [selectedDate, onSelectDate]);
    /* ---------------------------------------------------- */

    const getItemLayout = (_: any, index: number) => ({
        length: FULL_ITEM_WIDTH,
        offset: FULL_ITEM_WIDTH * index,
        index,
    });

    if (dates.length === 0) return null;

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={dates}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                initialNumToRender={15}
                maxToRenderPerBatch={10}
                windowSize={5}
                getItemLayout={getItemLayout}
                initialScrollIndex={BUFFER_DAYS}
                onEndReached={loadMoreFuture}
                onEndReachedThreshold={0.5}
                maintainVisibleContentPosition={{
                    minIndexForVisible: 0,
                    autoscrollToTopThreshold: 10
                }}
                onScroll={(e) => {
                    if (e.nativeEvent.contentOffset.x < 200) {
                        loadMorePast();
                    }
                }}
                scrollEventThrottle={16}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 0,
    },
    dayItem: {
        width: ITEM_WIDTH,
        height: 72,
        backgroundColor: '#FFFFFF',
        borderRadius: 18, // Keep rounded corners base
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: ITEM_MARGIN,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
        // Ensure border gets rendered within the bounds
        overflow: 'hidden',
    },
    activeDayItem: {
        backgroundColor: COLORS.primary,
    },
    // Subtle border when today is NOT selected
    todayItemBorder: {
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    // NEW: Sharp, crisp border when today IS selected
    selectedTodayBorder: {
        borderWidth: 2,
        borderColor: '#FFFFFF', // White border contrasts nicely with the Teal background
    },
    dayLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.textSecondary,
        marginBottom: 6,
    },
    dateLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },
    activeText: {
        color: '#FFFFFF',
    },
});