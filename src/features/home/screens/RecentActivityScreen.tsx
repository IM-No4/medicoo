import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppIcon from '../../../components/icons/AppIcon';
import { executeAction } from '../../../actions/ActionExecutor';

type FilterType = 'all' | 'consultation' | 'medicine' | 'lab';

export default function RecentActivityScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');

    // Get activities from params, or fallback to mock data
    const activities = route.params?.activities || [
        { id: 'act1', type: 'consultation', title: 'Dr. Sarah Wilson', date: 'Yesterday', status: 'Completed', statusColor: '#10B981' },
        { id: 'act2', type: 'medicine', title: 'Order #40239', date: '2 days ago', status: 'In Transit', statusColor: '#F59E0B' },
        { id: 'act3', type: 'lab', title: 'Blood Test Report', date: '4 days ago', status: 'View Report', statusColor: '#3B82F6' },
        { id: 'act4', type: 'consultation', title: 'Dr. James Miller', date: '1 week ago', status: 'Completed', statusColor: '#10B981' },
        { id: 'act5', type: 'medicine', title: 'Order #40102', date: '2 weeks ago', status: 'Delivered', statusColor: '#10B981' },
        { id: 'act6', type: 'lab', title: 'Lipid Profile Report', date: '3 weeks ago', status: 'View Report', statusColor: '#3B82F6' },
    ];

    const handleItemPress = (type: string, id: string) => {
        if (type === 'consultation') {
            const consultationId = id === 'act1' ? '1' : (id === 'act4' ? '2' : id);
            executeAction('OPEN_CONSULTATION_DETAIL', { consultationId });
        } else if (type === 'medicine') {
            const orderId = id === 'act2' ? 'ord1' : (id === 'act5' ? 'ord2' : id);
            executeAction('OPEN_MEDICINE_ORDER_DETAIL', { orderId });
        } else if (type === 'lab') {
            const testId = id === 'act3' ? 'lt1' : (id === 'act6' ? 'lt2' : id);
            executeAction('OPEN_LAB_TEST_DETAIL', { testId });
        }
    };

    const filteredActivities = activities.filter(
        (act: any) => activeFilter === 'all' || act.type === activeFilter
    );

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.cardItem}
            activeOpacity={0.7}
            onPress={() => handleItemPress(item.type, item.id)}
        >
            <View style={[styles.iconBox, { backgroundColor: getActivityColor(item.type).bg }]}>
                <AppIcon
                    name={getActivityIcon(item.type)}
                    size={18}
                    color={getActivityColor(item.type).icon}
                />
            </View>

            <View style={styles.content}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.date}>{item.date}</Text>
            </View>

            <View style={styles.statusContainer}>
                <Text style={[styles.status, { color: item.statusColor || '#6B7280' }]}>
                    {item.status}
                </Text>
                <ChevronRight size={16} color="#D1D5DB" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Activity History</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Filter Tabs */}
            <View style={styles.tabsContainer}>
                {(['all', 'consultation', 'medicine', 'lab'] as FilterType[]).map((filter) => (
                    <TouchableOpacity
                        key={filter}
                        style={[
                            styles.tab,
                            activeFilter === filter && styles.activeTab
                        ]}
                        onPress={() => setActiveFilter(filter)}
                    >
                        <Text style={[
                            styles.tabText,
                            activeFilter === filter && styles.activeTabText
                        ]}>
                            {filter === 'all' ? 'All' : (filter === 'consultation' ? 'Consultations' : (filter === 'medicine' ? 'Medicines' : 'Labs'))}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* List */}
            <FlatList
                data={filteredActivities}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <AppIcon name="info" size={48} color="#9CA3AF" />
                        <Text style={styles.emptyTitle}>No Activities Found</Text>
                        <Text style={styles.emptySubtitle}>There are no logs in this category.</Text>
                    </View>
                }
            />
        </View>
    );
}

function getActivityIcon(type: string): any {
    switch (type) {
        case 'consultation': return 'stethoscope';
        case 'medicine': return 'shopping-bag';
        case 'lab': return 'flask';
        default: return 'info';
    }
}

function getActivityColor(type: string) {
    switch (type) {
        case 'consultation': return { bg: '#EFF6FF', icon: '#3B82F6' };
        case 'medicine': return { bg: '#ECFDF5', icon: '#10B981' };
        case 'lab': return { bg: '#F5F3FF', icon: '#8B5CF6' };
        default: return { bg: '#F3F4F6', icon: '#6B7280' };
    }
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
        paddingBottom: 16,
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
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    tab: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
    },
    activeTab: {
        backgroundColor: '#2FA561',
    },
    tabText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#fff',
    },
    list: {
        padding: 20,
        gap: 12,
    },
    cardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderRadius: 16,
        padding: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    date: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    status: {
        fontSize: 12,
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 12,
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
    },
});
