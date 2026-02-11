import React from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../../../../components/icons/AppIcon';
import { Product, ProductShowcaseFeedItem } from '../feed.types';

import { FeedAction } from '../feed.actions';

type Props = {
    data: ProductShowcaseFeedItem;
    onAction?: (action: FeedAction) => void;
};

function ProductShowcaseCard({ data, onAction }: Props) {
    const handleProductPress = (item: Product) => {
        if (item.action && onAction) {
            onAction(item.action);
        }
    };

    const handleSeeAll = () => {
        if (data.seeAllAction && onAction) {
            onAction(data.seeAllAction);
        }
    };

    const renderItem = ({ item }: { item: Product }) => (
        <TouchableOpacity style={styles.productCard} activeOpacity={0.7} onPress={() => handleProductPress(item)}>
            <View style={styles.imageContainer}>
                {/* Placeholder for product image if not provided */}
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.image} resizeMode="contain" />
                ) : (
                    <View style={styles.placeholderImage}>
                        <AppIcon name="shopping-bag" size={24} color="#9CA3AF" />
                    </View>
                )}

                {item.discount && (
                    <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{item.discount} OFF</Text>
                    </View>
                )}
            </View>

            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            {item.uom && <Text style={styles.uom}>{item.uom}</Text>}

            <View style={styles.priceRow}>
                <Text style={styles.price}>₹{item.price}</Text>
                {item.originalPrice && (
                    <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
                )}
            </View>

            <TouchableOpacity style={styles.addButton} onPress={() => handleProductPress(item)}>
                <Text style={styles.addText}>ADD</Text>
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
                data={data.products}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

export default React.memo(ProductShowcaseCard);

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
    },
    productCard: {
        width: 140,
        marginHorizontal: 8,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    imageContainer: {
        width: '100%',
        height: 100,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        marginBottom: 12,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1
    },
    discountBadge: {
        position: 'absolute',
        top: 6,
        left: 6,
        backgroundColor: '#EF4444',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    discountText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    productName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
        height: 36, // Fixed height for alignment
    },
    uom: {
        fontSize: 11,
        color: '#9CA3AF',
        marginBottom: 8,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
        marginBottom: 12,
    },
    price: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    originalPrice: {
        fontSize: 11,
        color: '#9CA3AF',
        textDecorationLine: 'line-through',
    },
    addButton: {
        borderWidth: 1,
        borderColor: '#2563EB',
        borderRadius: 8,
        paddingVertical: 6,
        alignItems: 'center'
    },
    addText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2563EB'
    }
});
