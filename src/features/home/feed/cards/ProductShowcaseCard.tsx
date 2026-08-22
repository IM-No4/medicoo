import React from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../../../../components/icons/AppIcon';
import { Product, ProductShowcaseFeedItem } from '../feed.types';
import SectionHeader from './SectionHeader';

import { FeedAction } from '../feed.actions';

type Props = {
    data: ProductShowcaseFeedItem;
    onAction?: (action: FeedAction) => void;
};

import { ShowcaseSection } from '../feed.types';

function ProductShowcaseCard({ data, onAction }: Props) {
    const handleSectionPress = (section: ShowcaseSection) => {
        console.log('Navigating to Search with query:', section.title, 'and tags:', section.tags);
        if (onAction) {
            onAction({
                type: 'NAVIGATE',
                stack: 'SearchStack',
                screen: 'SearchHome',
                params: {
                    query: section.title,
                    tags: section.tags,
                }
            });
        }
    };

    const handleProductPress = (item: Product) => {
        if (item.action && onAction) {
            onAction(item.action);
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        // Handle Section Rendering
        if (data.sections?.length) {
            const section = item as ShowcaseSection;
            return (
                <TouchableOpacity
                    style={styles.productCard}
                    activeOpacity={0.7}
                    onPress={() => handleSectionPress(section)}
                >
                    <View style={styles.imageContainer}>
                        {!!section.imageUrl ? (
                            <Image source={{ uri: section.imageUrl }} style={styles.image} resizeMode="cover" />
                        ) : (
                            <View style={styles.placeholderImage}>
                                <AppIcon name="shopping-bag" size={24} color="#9CA3AF" />
                            </View>
                        )}
                    </View>

                    <View style={styles.infoContainer}>
                        <Text style={styles.productName} numberOfLines={2}>{section.title}</Text>
                        <View style={styles.footerRow}>
                            <View style={styles.arrowIcon}>
                                <AppIcon name="arrow-right" size={14} color="#5a6773ff" />
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            );
        }

        // Handle Product Rendering (Fallback)
        const product = item as Product;
        return (
            <TouchableOpacity style={styles.productCard} activeOpacity={0.7} onPress={() => handleProductPress(product)}>
                <View style={styles.imageContainer}>
                    {!!product.image ? (
                        <Image source={{ uri: product.image }} style={styles.image} resizeMode="contain" />
                    ) : (
                        <View style={styles.placeholderImage}>
                            <AppIcon name="shopping-bag" size={24} color="#9CA3AF" />
                        </View>
                    )}
                </View>

                <View style={styles.infoContainer}>
                    <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>

                    <View style={styles.footerRow}>
                        {typeof product.price === 'number' ? (
                            <View style={styles.priceRow}>
                                <Text style={styles.priceText}>₹{product.price}</Text>
                                {!!product.originalPrice && product.originalPrice > product.price && (
                                    <Text style={styles.originalPriceText}>₹{product.originalPrice}</Text>
                                )}
                            </View>
                        ) : (
                            <Text style={styles.viewDetailsText}>View Details</Text>
                        )}
                        <View style={styles.arrowIcon}>
                            <AppIcon name="arrow-right" size={14} color="#5a6773ff" />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <SectionHeader title={data.title} subtitle={data.subtitle} />

            <FlatList
                data={data.sections?.length ? data.sections : data.products}
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
        height: 85,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        marginBottom: 12,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    placeholderImage: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1
    },
    infoContainer: {
        flex: 1,
    },
    productName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 0,
        height: 36, // Fixed height for alignment
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
        flexShrink: 1,
    },
    priceText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    originalPriceText: {
        fontSize: 11,
        color: '#9CA3AF',
        textDecorationLine: 'line-through',
    },
    viewDetailsText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280',
        flexShrink: 1,
    },
    arrowIcon: {
        backgroundColor: '#ffffffff',
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: undefined,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    detailsContainer: {
        flex: 1,
    },
    tagText: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '500',
    }
});
