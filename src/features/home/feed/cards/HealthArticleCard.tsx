import React from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../../../../components/icons/AppIcon';
import { Article, HealthArticleShowcaseFeedItem } from '../feed.types';

import { FeedAction } from '../feed.actions';

type Props = {
    data: HealthArticleShowcaseFeedItem;
    onAction?: (action: FeedAction) => void;
};

function HealthArticleCard({ data, onAction }: Props) {
    const handlePress = (item: Article) => {
        if (item.action && onAction) {
            onAction(item.action);
        }
    };

    const handleSeeAll = () => {
        if (data.seeAllAction && onAction) {
            onAction(data.seeAllAction);
        }
    };

    const renderItem = ({ item }: { item: Article }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => handlePress(item)}
            disabled={!item.action}
        >
            <View style={styles.imageContainer}>
                {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
                ) : (
                    <View style={styles.placeholderImage}>
                        <AppIcon name="file-text" size={32} color="#9CA3AF" />
                    </View>
                )}
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                </View>
            </View>

            <View style={styles.content}>
                <Text style={styles.articleTitle} numberOfLines={2}>{item.title}</Text>

                <View style={styles.metaRow}>
                    {item.author && <Text style={styles.metaText}>By {item.author}</Text>}
                    <View style={styles.dot} />
                    <Text style={styles.metaText}>{item.readTime}</Text>
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
                data={data.articles}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

export default React.memo(HealthArticleCard);

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
        width: 240,
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
        height: 140,
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
    categoryBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: '#fff',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 99
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#111827'
    },
    content: {
        padding: 16
    },
    articleTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
        lineHeight: 22
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    metaText: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '500'
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#9CA3AF'
    }
});
