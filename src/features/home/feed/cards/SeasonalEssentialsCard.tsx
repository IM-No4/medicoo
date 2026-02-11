import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { Sparkles } from 'lucide-react-native';
import React from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../../../../components/icons/AppIcon';
import { FeedAction } from '../feed.actions';
import { SeasonalCollection, SeasonalEssentialsFeedItem } from '../feed.types';

type Props = {
    data: SeasonalEssentialsFeedItem;
    onAction?: (action: FeedAction) => void;
};

const SEASON_CONFIG = {
    SUMMER: {
        gradient: ['#FEF3C7', '#FFFBEB'], // Amber-100 to Amber-50
        accent: '#F59E0B',
        icon: 'sun',
        textColor: '#92400E',
    },
    WINTER: {
        gradient: ['#DBEAFE', '#EFF6FF'], // Blue-100 to Blue-50
        accent: '#3B82F6',
        icon: 'snowflake',
        textColor: '#1E40AF',
    },
    MONSOON: {
        gradient: ['#D1FAE5', '#ECFDF5'], // Emerald-100 to Emerald-50
        accent: '#10B981',
        icon: 'cloud-rain',
        textColor: '#065F46',
    },
    SPRING: {
        gradient: ['#FCE7F3', '#FDF2F8'], // Pink-100 to Pink-50
        accent: '#EC4899',
        icon: 'flower',
        textColor: '#9D174D',
    },
};

const hexToRgba = (hex: string, alpha: number) => {
    // If hex is undefined or invalid, return a default color
    if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) return hex || '#000000';

    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const lightenColor = (hex: string, percent: number) => {
    // If hex is undefined or invalid, return a default color
    if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) return hex || '#F59E0B';

    const num = parseInt(hex.replace("#", ""), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) + amt,
        B = ((num >> 8) & 0x00ff) + amt,
        G = (num & 0x0000ff) + amt;
    return (
        "#" +
        (
            0x1000000 +
            (R < 255 ? (R < 1 ? 1 : R) : 255) * 0x10000 +
            (B < 255 ? (B < 1 ? 1 : B) : 255) * 0x100 +
            (G < 255 ? (G < 1 ? 1 : G) : 255)
        )
            .toString(16)
            .slice(1)
    );
};

function SeasonalEssentialsCard({ data, onAction }: Props) {
    const defaultTheme = SEASON_CONFIG[data.season] || SEASON_CONFIG.SUMMER;

    // Check if API provided any background instruction
    const hasApiBackground = !!(data.theme?.gradient || data.theme?.backgroundColor || data.theme?.backgroundImage || data.theme?.lottieUrl);

    // Merge backend theme with local defaults
    const theme = {
        gradient: data.theme?.gradient || (hasApiBackground ? undefined : defaultTheme.gradient),
        backgroundColor: data.theme?.backgroundColor,
        accentColor: data.theme?.accentColor || defaultTheme.accent,
        textColor: data.theme?.textColor || defaultTheme.textColor,
        backgroundImage: data.theme?.backgroundImage,
        lottieUrl: data.theme?.lottieUrl,
        sparkleColor: data.theme?.sparkleColor || data.theme?.accentColor || defaultTheme.accent,
    };

    const handlePress = (item: SeasonalCollection) => {
        if (onAction) {
            onAction({
                type: 'NAVIGATE',
                stack: 'SearchStack',
                screen: 'SearchHome',
                params: {
                    query: item.name,
                    category: 'medicine',
                    type: 'name'
                }
            } as any);
        }
    };

    const renderItem = ({ item }: { item: SeasonalCollection }) => (
        <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
        >
            <LinearGradient
                colors={[
                    item.iconColor || theme.accentColor,
                    lightenColor(item.iconColor || theme.accentColor, 40) // Create a lighter variant
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconBox}
            >
                <AppIcon
                    name={(item.icon || 'star') as any}
                    size={28}
                    color={'#fff'}
                />
            </LinearGradient>

            <Text
                style={[styles.itemName, { color: theme.textColor }]}
                numberOfLines={2}
            >
                {item.name}
            </Text>
        </TouchableOpacity>
    );

    const renderBackground = () => {
        return (
            <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
                {/* Primary Layer: Image > Gradient > Color */}
                {theme.backgroundImage ? (
                    <Image
                        source={{ uri: theme.backgroundImage }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                        blurRadius={30} // Subtle blur for section background
                    />
                ) : theme.gradient ? (
                    <LinearGradient
                        colors={theme.gradient as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[StyleSheet.absoluteFill, { opacity: 0.8 }]}
                        locations={[0, 0.8]}
                    />
                ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.backgroundColor || '#F9FAFB' }]} />
                )}

                {/* Secondary Layer: Lottie (Overlay) */}
                {theme.lottieUrl && (
                    <LottieView
                        source={{ uri: theme.lottieUrl }}
                        autoPlay
                        loop
                        style={[StyleSheet.absoluteFill, { opacity: 0.6 }]} // Reduced opacity for section
                        resizeMode="cover"
                    />
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {renderBackground()}

            <View style={styles.gradientContainer}>
                <View style={styles.header}>
                    <View>
                        <View style={styles.titleRow}>
                            <Text style={[styles.title, { color: theme.textColor }]}>{data.title}</Text>
                            <Sparkles size={16} color={theme.sparkleColor} style={{ marginLeft: 6 }} />
                        </View>
                        {data.subtitle && (
                            <Text style={[styles.subtitle, { color: theme.textColor, opacity: 0.8 }]}>
                                {data.subtitle}
                            </Text>
                        )}
                    </View>
                </View>

                <FlatList
                    data={data.collections}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                />
            </View>
        </View>
    );
}

export default React.memo(SeasonalEssentialsCard);

const styles = StyleSheet.create({
    container: {
        marginBottom: 32,
        paddingVertical: 4, // Spacing inside the gradient
    },
    gradientContainer: {
        paddingVertical: 20,
    },
    header: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 13,
        marginTop: 2,
        fontWeight: '500',
    },
    listContent: {
        paddingHorizontal: 12,
        paddingBottom: 8,
    },
    itemContainer: {
        width: 96,
        marginHorizontal: 8,
        alignItems: 'center',
    },
    iconBox: {
        width: 96,
        height: 96,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        // Crisp shadow for the icon button
        shadowColor: "rgba(0,0,0,0.05)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 3,
    },
    itemName: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 15,
        opacity: 0.9,
    },
});
