import React from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../../../../components/icons/AppIcon';
import { Doctor, DoctorRecommendationFeedItem } from '../feed.types';

import { FeedAction } from '../feed.actions';

type Props = {
    data: DoctorRecommendationFeedItem;
    onAction?: (action: FeedAction) => void;
};

function DoctorRecommendationCard({ data, onAction }: Props) {
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
                <View style={styles.ratingBadge}>
                    <AppIcon name="star" size={10} color="#FFFFFF" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
            </View>

            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.specialty} numberOfLines={1}>{item.specialty}</Text>
            <Text style={styles.experience}>{item.experience} exp</Text>

            <TouchableOpacity
                style={styles.bookButton}
                onPress={() => handleDoctorPress(item)}
                disabled={!item.action}
            >
                <Text style={styles.bookButtonText}>Book</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>{data.title}</Text>
                    {data.subtitle && <Text style={styles.subtitle}>{data.subtitle}</Text>}
                </View>
                {data.seeAllAction && (
                    <TouchableOpacity onPress={handleSeeAll}>
                        <Text style={styles.seeAll}>See All</Text>
                    </TouchableOpacity>
                )}
            </View>

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

const styles = StyleSheet.create({
    container: {
        marginBottom: 28,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    subtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    seeAll: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2563EB',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 8, // For shadow
    },
    card: {
        width: 130,
        marginHorizontal: 8,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        // Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    imageContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        marginBottom: 10,
        position: 'relative',
        // Border for clean look
        borderWidth: 2,
        borderColor: '#F3F4F6',
        backgroundColor: '#F9FAFB',
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
        backgroundColor: '#E0E7FF',
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
        color: '#111827',
        marginBottom: 2,
        textAlign: 'center',
    },
    specialty: {
        fontSize: 11,
        color: '#6B7280',
        marginBottom: 2,
        textAlign: 'center',
    },
    experience: {
        fontSize: 10,
        color: '#9CA3AF',
        marginBottom: 12,
        textAlign: 'center',
    },
    bookButton: {
        backgroundColor: '#EFF6FF',
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
