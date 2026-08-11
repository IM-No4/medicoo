import React from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../../../../components/icons/AppIcon';
import { FeedAction } from '../feed.actions';
import { CategoryRowItem } from '../feed.types';

type Props = {
    title: string;
    items: CategoryRowItem[];
    onAction: (action: FeedAction) => void;
};

// Zomato-style "what's on your mind" category selector: circular photo,
// label below, tightly packed, no card border/shadow - a flat entry point
// into a category, not a product carousel in its own right.
function CategoryRow({ title, items, onAction }: Props) {
    const renderItem = ({ item }: { item: CategoryRowItem }) => (
        <TouchableOpacity
            style={styles.item}
            activeOpacity={0.75}
            onPress={() => onAction(item.action)}
        >
            <View style={styles.circle}>
                {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
                ) : (
                    <AppIcon name="shopping-bag" size={28} color="#9CA3AF" />
                )}
            </View>
            <Text style={styles.label} numberOfLines={2}>{item.title}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {!!title && <Text style={styles.title}>{title}</Text>}
            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

export default React.memo(CategoryRow);

const styles = StyleSheet.create({
    container: {
        marginBottom: 28,
    },
    title: {
        fontSize: 13,
        color: '#494949',
        letterSpacing: 2,
        fontWeight: '700',
        textTransform: 'uppercase',
        paddingHorizontal: 20,
        marginBottom: 14,
    },
    listContent: {
        paddingHorizontal: 20,
    },
    item: {
        width: 78,
        alignItems: 'center',
        marginRight: 16,
    },
    circle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e4e6e918',
        elevation: 1,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
    },
});
