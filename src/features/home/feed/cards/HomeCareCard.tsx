import React from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../../../../components/icons/AppIcon';
import { HomeCareService, HomeCareShowcaseFeedItem } from '../feed.types';

import { FeedAction } from '../feed.actions';

type Props = {
    data: HomeCareShowcaseFeedItem;
    onAction?: (action: FeedAction) => void;
};

function HomeCareCard({ data, onAction }: Props) {
    const handlePress = (item: HomeCareService) => {
        if (item.action && onAction) {
            onAction(item.action);
        }
    };

    const handleSeeAll = () => {
        if (data.seeAllAction && onAction) {
            onAction(data.seeAllAction);
        }
    };

    const renderItem = ({ item }: { item: HomeCareService }) => (
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
                        <AppIcon name="heart" size={28} color="#EC4899" />
                    </View>
                )}
                <View style={styles.providerBadge}>
                    <Text style={styles.providerText}>{item.provider}</Text>
                </View>
            </View>

            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

                <View style={styles.metaRow}>
                    <AppIcon name="clock" size={12} color="#6B7280" />
                    <Text style={styles.durationText}>{item.duration}</Text>
                    <View style={styles.dot} />
                    <AppIcon name="star" size={10} color="#F59E0B" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                </View>

                <View style={styles.featuresList}>
                    {item.features.slice(0, 2).map((feat, i) => (
                        <View key={i} style={styles.featureItem}>
                            <View style={styles.bullet} />
                            <Text style={styles.featureText}>{feat}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.divider} />

                <View style={styles.priceRow}>
                    <Text style={styles.price}>₹{item.price}</Text>
                    <TouchableOpacity
                        style={styles.bookButton}
                        onPress={() => handlePress(item)}
                    >
                        <Text style={styles.bookButtonText}>Book Now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.sectionHeader}>
                <View>
                    <Text style={styles.sectionTitle}>{data.title}</Text>
                    {data.subtitle && <Text style={styles.sectionSubtitle}>{data.subtitle}</Text>}
                </View>
                {data.seeAllAction && (
                    <TouchableOpacity onPress={handleSeeAll}>
                        <Text style={styles.seeAll}>See All</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={data.services}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

export default React.memo(HomeCareCard);

const styles = StyleSheet.create({
    container: {
        marginBottom: 28,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    sectionSubtitle: {
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
        paddingBottom: 8,
    },
    card: {
        width: 200,
        marginHorizontal: 8,
        backgroundColor: '#fff',
        borderRadius: 20,
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
        backgroundColor: '#FDF2F8',
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
    providerBadge: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6
    },
    providerText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#DB2777'
    },
    content: {
        padding: 12
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 6,
        height: 38
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 4
    },
    durationText: {
        fontSize: 11,
        color: '#6B7280'
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#D1D5DB'
    },
    ratingText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#F59E0B'
    },
    featuresList: {
        marginBottom: 12,
        gap: 4
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    bullet: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#DB2777'
    },
    featureText: {
        fontSize: 11,
        color: '#4B5563'
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginBottom: 10
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    price: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827'
    },
    bookButton: {
        backgroundColor: '#FDF2F8',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FBCFE8'
    },
    bookButtonText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#DB2777'
    }
});
