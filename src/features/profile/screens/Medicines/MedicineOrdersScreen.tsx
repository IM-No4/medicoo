import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
    ChevronLeft,
    ChevronRight,
    Hash,
    Package,
    Pill,
    RefreshCcw,
    Search,
    Truck
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { executeAction } from '../../../../actions/ActionExecutor';
import { getMyOrders } from '../../../../services/api';

interface Order {
    _id: string;
    orderId: string;
    pharmacyName: string;
    itemsCount: number;
    totalAmount: number;
    status: 'Placed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
    createdAt: string;
    deliveryDate?: string;
}

export default function MedicineOrdersScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);

    const fetchOrders = useCallback(async () => {
        try {
            const data = await getMyOrders();
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
            // Fallback mock data
            if (orders.length === 0) {
                setOrders([
                    {
                        _id: 'ord1',
                        orderId: 'MED-78291',
                        pharmacyName: 'Apollo Pharmacy',
                        itemsCount: 3,
                        totalAmount: 1250,
                        status: 'Delivered',
                        createdAt: '2026-01-18T10:30:00Z',
                        deliveryDate: '2026-01-20'
                    },
                    {
                        _id: 'ord2',
                        orderId: 'MED-99210',
                        pharmacyName: 'Wellness Forever',
                        itemsCount: 1,
                        totalAmount: 450,
                        status: 'Shipped',
                        createdAt: '2026-01-22T15:45:00Z',
                    },
                    {
                        _id: 'ord3',
                        orderId: 'MED-66123',
                        pharmacyName: 'Netmeds Online',
                        itemsCount: 5,
                        totalAmount: 2100,
                        status: 'Processing',
                        createdAt: '2026-01-23T09:00:00Z',
                    }
                ]);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [orders.length]);

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [fetchOrders])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchOrders();
    }, [fetchOrders]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Delivered': return { bg: '#F0FDF4', text: '#10B981' };
            case 'Shipped': return { bg: '#EFF6FF', text: '#3B82F6' };
            case 'Processing': return { bg: '#FFF7ED', text: '#F59E0B' };
            case 'Placed': return { bg: '#F9FAFB', text: '#6B7280' };
            case 'Cancelled': return { bg: '#FEF2F2', text: '#EF4444' };
            default: return { bg: '#F9FAFB', text: '#6B7280' };
        }
    };

    const renderItem = ({ item }: { item: Order }) => {
        const statusStyle = getStatusStyle(item.status);
        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => executeAction('OPEN_MEDICINE_ORDER_DETAIL', { orderId: item._id })}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.orderIdGroup}>
                        <Hash size={16} color="#9CA3AF" />
                        <Text style={styles.orderIdText}>{item.orderId}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.pharmacySection}>
                        <View style={styles.iconCircle}>
                            <Pill size={20} color="#2FA561" />
                        </View>
                        <View>
                            <Text style={styles.pharmacyName}>{item.pharmacyName}</Text>
                            <Text style={styles.itemCountText}>{item.itemsCount} Items • Ordered on {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                        </View>
                    </View>
                    <View style={styles.priceSection}>
                        <Text style={styles.amountLabel}>Total Amount</Text>
                        <Text style={styles.amountValue}>₹{item.totalAmount}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardFooter}>
                    {item.status === 'Delivered' ? (
                        <View style={styles.deliveryInfo}>
                            <Package size={14} color="#10B981" />
                            <Text style={styles.deliveryText}>Delivered on {item.deliveryDate}</Text>
                        </View>
                    ) : item.status === 'Shipped' ? (
                        <View style={styles.deliveryInfo}>
                            <Truck size={14} color="#3B82F6" />
                            <Text style={[styles.deliveryText, { color: '#3B82F6' }]}>Arriving in 2 days</Text>
                        </View>
                    ) : (
                        <View style={styles.deliveryInfo}>
                            <RefreshCcw size={14} color="#F59E0B" />
                            <Text style={[styles.deliveryText, { color: '#F59E0B' }]}>Being packed at pharmacy</Text>
                        </View>
                    )}
                    <ChevronRight size={18} color="#9CA3AF" />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Medicine Orders</Text>
                <TouchableOpacity style={styles.searchButton}>
                    <Search size={20} color="#1F2937" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={orders}
                renderItem={renderItem}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2FA561']} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Image
                                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4522/4522251.png' }}
                                style={styles.emptyImage}
                            />
                            <Text style={styles.emptyTitle}>No Orders Yet</Text>
                            <Text style={styles.emptySubtitle}>You haven't ordered any medicines yet. Shop our pharmacy for great deals.</Text>
                            <TouchableOpacity style={styles.shopButton} onPress={() => executeAction('OPEN_PHARMACY_LIST')}>
                                <Text style={styles.shopButtonText}>Shop Medicines</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#2FA561" />
                        </View>
                    )
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FE',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 8,
        marginLeft: -12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    searchButton: {
        padding: 8,
        marginRight: -12,
    },
    listContent: {
        padding: 20,
        gap: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 15,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    orderIdGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    orderIdText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    cardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    pharmacySection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pharmacyName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    itemCountText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    priceSection: {
        alignItems: 'flex-end',
    },
    amountLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '600',
        marginBottom: 2,
    },
    amountValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
    },
    divider: {
        height: 1,
        backgroundColor: '#F8F9FA',
        marginVertical: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    deliveryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    deliveryText: {
        fontSize: 13,
        color: '#10B981',
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
        paddingHorizontal: 40,
    },
    emptyImage: {
        width: 120,
        height: 120,
        marginBottom: 24,
        opacity: 0.8,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 30,
    },
    shopButton: {
        backgroundColor: '#2FA561',
        paddingHorizontal: 30,
        paddingVertical: 16,
        borderRadius: 20,
        shadowColor: '#2FA561',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    shopButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    loadingContainer: {
        marginTop: 100,
        alignItems: 'center',
    },
});
