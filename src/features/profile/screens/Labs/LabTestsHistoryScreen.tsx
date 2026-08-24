import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
    Activity,
    ChevronLeft,
    Clock,
    Download,
    FlaskConical,
    Search
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { executeAction } from '../../../../actions/ActionExecutor';
import { getMyLabTests } from '../../../../services/api';

interface LabTest {
    _id: string;
    testName: string;
    labName: string;
    patientName: string;
    date: string;
    status: 'Scheduled' | 'Sample Collected' | 'Processing' | 'Completed' | 'Cancelled';
    reportAvailable: boolean;
}

export default function LabTestsHistoryScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tests, setTests] = useState<LabTest[]>([]);

    const fetchTests = useCallback(async () => {
        try {
            const data = await getMyLabTests();
            setTests(data || []);
        } catch (error) {
            console.error('Error fetching lab tests:', error);
            setTests([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchTests();
        }, [fetchTests])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchTests();
    }, [fetchTests]);

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'Completed': return { color: '#10B981', label: 'Report Ready' };
            case 'Processing': return { color: '#3B82F6', label: 'Analyzing Sample' };
            case 'Sample Collected': return { color: '#F59E0B', label: 'In Transit' };
            case 'Scheduled': return { color: '#6B7280', label: 'Upcoming' };
            default: return { color: '#6B7280', label: status };
        }
    };

    const renderItem = ({ item }: { item: LabTest }) => {
        const statusInfo = getStatusInfo(item.status);
        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => executeAction('OPEN_LAB_TEST_DETAIL', { testId: item._id })}
            >
                <View style={styles.cardMain}>
                    <View style={styles.iconContainer}>
                        <View style={styles.flaskCircle}>
                            <FlaskConical size={24} color="#6366F1" />
                        </View>
                        {item.reportAvailable && (
                            <View style={styles.checkBadge}>
                                <Activity size={10} color="#fff" />
                            </View>
                        )}
                    </View>
                    <View style={styles.testInfo}>
                        <Text style={styles.testName}>{item.testName}</Text>
                        <Text style={styles.labName}>{item.labName}</Text>
                        <View style={styles.patientRow}>
                            <Text style={styles.patientLabel}>Patient:</Text>
                            <Text style={styles.patientValue}>{item.patientName}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardFooter}>
                    <View style={styles.footerLeft}>
                        <Clock size={14} color="#9CA3AF" />
                        <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                    </View>
                    <View style={styles.footerRight}>
                        <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                        {item.reportAvailable && (
                            <TouchableOpacity style={styles.downloadSm}>
                                <Download size={14} color="#10B981" />
                            </TouchableOpacity>
                        )}
                    </View>
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
                <Text style={styles.headerTitle}>My Lab Tests</Text>
                <TouchableOpacity style={styles.searchButton}>
                    <Search size={20} color="#1F2937" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={tests}
                renderItem={renderItem}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0FBBA1']} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconCircle}>
                                <FlaskConical size={40} color="#9CA3AF" />
                            </View>
                            <Text style={styles.emptyTitle}>No Test Results</Text>
                            <Text style={styles.emptySubtitle}>Your lab test history and reports will appear here once you book a test.</Text>
                        </View>
                    ) : (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#0FBBA1" />
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
        gap: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    cardMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconContainer: {
        position: 'relative',
    },
    flaskCircle: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#F59E0B',
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    testInfo: {
        flex: 1,
        gap: 4,
    },
    testName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },
    labName: {
        fontSize: 13,
        color: '#6366F1',
        fontWeight: '700',
    },
    patientRow: {
        flexDirection: 'row',
        gap: 4,
        alignItems: 'center',
    },
    patientLabel: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    patientValue: {
        fontSize: 12,
        color: '#4B5563',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#F9FAFB',
        marginVertical: 14,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    footerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    downloadSm: {
        backgroundColor: '#F0FDF4',
        padding: 4,
        borderRadius: 6,
        marginLeft: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 80,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    loadingContainer: {
        marginTop: 100,
        alignItems: 'center',
    },
});
