import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../../../../components/icons/AppIcon';
import { LabPackage, LabPackageShowcaseFeedItem } from '../feed.types';
import SectionHeader from './SectionHeader';

import { FeedAction } from '../feed.actions';

type Props = {
    data: LabPackageShowcaseFeedItem;
    onAction?: (action: FeedAction) => void;
};

function LabPackageCard({ data, onAction }: Props) {
    const handlePress = (item: LabPackage) => {
        if (item.action && onAction) {
            onAction(item.action);
        }
    };

    const handleSeeAll = () => {
        if (data.seeAllAction && onAction) {
            onAction(data.seeAllAction);
        }
    };

    const renderItem = ({ item }: { item: LabPackage }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => handlePress(item)}
        >
            <View style={styles.headerRow}>
                <View style={styles.iconBox}>
                    <AppIcon name="flask" size={18} color="#7C3AED" />
                </View>
                <View style={styles.tatBadge}>
                    <AppIcon name="clock" size={10} color="#6B7280" />
                    <Text style={styles.tatText}>{item.tat}</Text>
                </View>
            </View>

            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

            <View style={styles.includesContainer}>
                <Text style={styles.includesCount}>{item.testCount} Tests included</Text>
                <Text style={styles.includesList} numberOfLines={1}>
                    {item.includes.join(', ')}
                </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.priceRow}>
                <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.price}>₹{item.price}</Text>
                        {item.originalPrice && (
                            <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
                        )}
                    </View>
                    {item.discount && (
                        <Text style={styles.discountText}>{item.discount} OFF</Text>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => handlePress(item)}
                >
                    <Text style={styles.bookButtonText}>Book</Text>
                </TouchableOpacity>
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
                data={data.packages}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

export default React.memo(LabPackageCard);

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
        borderRadius: 20,
        padding: 16,
        // Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#F5F3FF',
        justifyContent: 'center',
        alignItems: 'center'
    },
    tatBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8
    },
    tatText: {
        fontSize: 10,
        color: '#4B5563',
        fontWeight: '600'
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
        height: 40
    },
    includesContainer: {
        marginBottom: 12,
        gap: 2
    },
    includesCount: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4B5563'
    },
    includesList: {
        fontSize: 11,
        color: '#9CA3AF'
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginBottom: 12
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    price: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827'
    },
    originalPrice: {
        fontSize: 12,
        color: '#9CA3AF',
        textDecorationLine: 'line-through'
    },
    discountText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#059669',
        marginTop: 2
    },
    bookButton: {
        backgroundColor: '#7C3AED',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 10
    },
    bookButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff'
    }
});
