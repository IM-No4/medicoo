import React from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../../../../components/icons/AppIcon';
import { Hospital, HospitalShowcaseFeedItem } from '../feed.types';
import SectionHeader from './SectionHeader';

import { FeedAction } from '../feed.actions';

type Props = {
    data: HospitalShowcaseFeedItem;
    onAction?: (action: FeedAction) => void;
};

function HospitalCard({ data, onAction }: Props) {
    const handlePress = (item: Hospital) => {
        if (item.action && onAction) {
            onAction(item.action);
        }
    };

    const handleSeeAll = () => {
        if (data.seeAllAction && onAction) {
            onAction(data.seeAllAction);
        }
    };

    const renderItem = ({ item }: { item: Hospital }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => handlePress(item)}
            disabled={!item.action}
        >
            <View style={styles.imageContainer}>
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
                ) : (
                    <View style={styles.placeholderImage}>
                        <AppIcon name="hospital" size={32} color="#9CA3AF" />
                    </View>
                )}
                <View style={styles.ratingBadge}>
                    <AppIcon name="star" size={10} color="#fff" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
            </View>

            <View style={styles.content}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.address} numberOfLines={1}>{item.address}</Text>

                <View style={styles.facilitiesRow}>
                    {item.facilities.slice(0, 2).map((fac, i) => (
                        <View key={i} style={styles.facilityTag}>
                            <Text style={styles.facilityText}>{fac}</Text>
                        </View>
                    ))}
                    {item.facilities.length > 2 && (
                        <Text style={styles.moreFacilities}>+{item.facilities.length - 2}</Text>
                    )}
                </View>

                <View style={styles.distanceBadge}>
                    <AppIcon name="map-pin" size={10} color="#059669" />
                    <Text style={styles.distanceText}>{item.distance}</Text>
                </View>
            </View>
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
                data={data.hospitals}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

export default React.memo(HospitalCard);

const styles = StyleSheet.create({
    container: {
        marginBottom: 28,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    card: {
        width: 200,
        marginHorizontal: 8,
        backgroundColor: '#fff',
        borderRadius: 16,
        // Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        overflow: 'hidden'
    },
    imageContainer: {
        height: 110,
        backgroundColor: '#F3F4F6',
        position: 'relative'
    },
    image: {
        width: '100%',
        height: '100%'
    },
    placeholderImage: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    ratingBadge: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3
    },
    ratingText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700'
    },
    content: {
        padding: 12
    },
    name: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2
    },
    address: {
        fontSize: 11,
        color: '#6B7280',
        marginBottom: 10
    },
    facilitiesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10
    },
    facilityTag: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4
    },
    facilityText: {
        fontSize: 10,
        color: '#4B5563',
        fontWeight: '600'
    },
    moreFacilities: {
        fontSize: 10,
        color: '#6B7280'
    },
    distanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    distanceText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#059669'
    }
});
