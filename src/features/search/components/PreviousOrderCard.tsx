import { executeAction } from '@/src/actions/ActionExecutor';
import AppIcon from '@/src/components/icons/AppIcon';
import React, { useMemo } from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

type Props = {
    order: {
        id: string;
        pharmacyName: string;
        deliveryTime: string;
        itemName: string;
        price: number;
        pharmacyLogo?: string;
        isVeg?: boolean; // Using Swiggy terms for clarity in logic, though medicines aren't veg/non-veg
    };
    onPress: () => void;
};

export default function PreviousOrderCard({ order, onPress }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            style={styles.card}
            onPress={onPress}
        >
            <View style={styles.header}>
                <View style={styles.pharmacyInfo}>
                    <View style={styles.logoContainer}>
                        {order.pharmacyLogo ? (
                            <Image source={{ uri: order.pharmacyLogo }} style={styles.logo} />
                        ) : (
                            <View style={styles.logoPlaceholder}>
                                <AppIcon name="store" size={20} color={theme.textSecondary} />
                            </View>
                        )}
                    </View>
                    <View>
                        <Text style={styles.pharmacyName}>{order.pharmacyName} • {order.deliveryTime}</Text>
                        <View style={styles.benefitRow}>
                            <AppIcon name="tag" size={14} color="#EB6E25" />
                            <Text style={styles.benefitText}>Items at ₹49 + one benefits</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.footer}>
                <View style={styles.itemRow}>
                    <View style={styles.vegIndicator}>
                        <View style={[styles.vegDot, { backgroundColor: '#10B981' }]} />
                    </View>
                    <Text style={styles.itemName}>{order.itemName}</Text>
                </View>
                <Text style={styles.price}>₹{order.price}</Text>

                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => executeAction('ADD_MEDICINE_FROM_SEARCH', { itemId: order.id })}
                >
                    <AppIcon name="plus" size={20} color="#10B981" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    card: {
        backgroundColor: c.card,
        borderRadius: 20,
        marginHorizontal: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: c.borderLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    pharmacyInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoContainer: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: c.cardSecondary,
        overflow: 'hidden',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    logoPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pharmacyName: {
        fontSize: 16,
        fontWeight: '800',
        color: c.text,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    benefitText: {
        fontSize: 13,
        color: c.textSecondary,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: c.cardSecondary,
        marginVertical: 4,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        position: 'relative',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 8,
    },
    vegIndicator: {
        width: 14,
        height: 14,
        borderWidth: 1,
        borderColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2,
    },
    vegDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '700',
        color: c.text,
        flex: 1,
    },
    price: {
        fontSize: 14,
        fontWeight: '700',
        color: c.text,
        marginRight: 60,
    },
    addButton: {
        position: 'absolute',
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: c.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
