import React, { useMemo } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../../../../components/icons/AppIcon';
import { Doctor, DoctorRecommendationFeedItem } from '../feed.types';
import SectionHeader from './SectionHeader';

import { FeedAction } from '../feed.actions';
import { useTheme } from '../../../../theme/ThemeContext';
import type { ThemeColors } from '../../../../theme/colors';
import { useLanguage } from '../../../../i18n/LanguageContext';

type Props = {
    data: DoctorRecommendationFeedItem;
    onAction?: (action: FeedAction) => void;
};

function DoctorRecommendationCard({ data, onAction }: Props) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    const handleDoctorPress = (item: Doctor) => {
        if (item.action && onAction) {
            onAction(item.action);
        }
    };

    const handleSeeAll = () => {
        if (data.seeAllAction && onAction) {
            onAction(data.seeAllAction);
        }
    };

    const renderItem = ({ item }: { item: Doctor }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => handleDoctorPress(item)}
            disabled={!item.action}
        >
            <View style={styles.imageContainer}>
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Text style={styles.placeholderText}>{(item.name || '?').charAt(0)}</Text>
                    </View>
                )}
                {/* 0 means genuinely no ratings yet (see homeController.js's
                    DOCTOR_RECOMMENDATION handler) - showing a star badge
                    with "0" would read as a bad rating rather than no
                    rating, so it's left out entirely instead. */}
                {item.rating > 0 && (
                    <View style={styles.ratingBadge}>
                        <AppIcon name="star" size={10} color="#FFFFFF" />
                        <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                )}
            </View>

            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.specialty} numberOfLines={1}>{item.specialty}</Text>
            <Text style={styles.experience}>{item.experience} exp</Text>

            <TouchableOpacity
                style={styles.bookButton}
                onPress={() => handleDoctorPress(item)}
                disabled={!item.action}
            >
                <Text style={styles.bookButtonText}>{t('book')}</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <SectionHeader
                title={data.title}
                subtitle={data.subtitle}
                onSeeAll={data.seeAllAction ? handleSeeAll : undefined}
            />

            <FlatList
                data={data.doctors}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

export default React.memo(DoctorRecommendationCard);

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: {
        marginBottom: 30,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 8, // For shadow
    },
    card: {
        width: 130,
        marginHorizontal: 8,
        backgroundColor: c.card,
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        // Flat border-only look, matching ProductShowcaseCard.tsx (no
        // shadow at all, just borderWidth/borderColor) - any shadow/
        // elevation here, however tuned down, still read as heavier than
        // the rest of the feed's cards.
        borderWidth: 1,
        borderColor: c.borderLight,
    },
    imageContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        marginBottom: 10,
        position: 'relative',
        // Border for clean look
        borderWidth: 2,
        borderColor: c.borderLight,
        backgroundColor: c.cardSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 32,
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        borderRadius: 32,
        backgroundColor: c.infoBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#4F46E5',
    },
    ratingBadge: {
        position: 'absolute',
        bottom: -4,
        backgroundColor: '#F59E0B',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        gap: 2,
        borderWidth: 2,
        borderColor: '#fff',
    },
    ratingText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#fff',
    },
    name: {
        fontSize: 13,
        fontWeight: '700',
        color: c.text,
        marginBottom: 2,
        textAlign: 'center',
    },
    specialty: {
        fontSize: 11,
        color: c.textSecondary,
        marginBottom: 2,
        textAlign: 'center',
    },
    experience: {
        fontSize: 10,
        color: c.textMuted,
        marginBottom: 12,
        textAlign: 'center',
    },
    bookButton: {
        backgroundColor: c.infoBg,
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    bookButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2563EB',
    },
});
