import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, ChevronRight, HeartPulse, Plus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    getHealthRiskAssessmentHistory,
    HealthRiskAssessmentResult,
} from '../../../../services/api/healthRiskAssessment.api';

const BUCKET_COLOR: Record<string, string> = {
    'Needs attention': '#F59E0B',
    Fair: '#3B82F6',
    Good: '#10B981',
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function HealthAssessmentHistoryScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    const [assessments, setAssessments] = useState<HealthRiskAssessmentResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getHealthRiskAssessmentHistory()
            .then(setAssessments)
            .catch((e) => console.warn('Failed to fetch health assessment history:', e))
            .finally(() => setLoading(false));
    }, []);

    const handleSelect = (result: HealthRiskAssessmentResult) => {
        navigation.navigate('HealthRiskAssessment', { viewResult: result });
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Health Assessments</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                style={styles.flexOne}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <TouchableOpacity
                    style={styles.newCard}
                    onPress={() => navigation.navigate('HealthRiskAssessment')}
                    activeOpacity={0.85}
                >
                    <View style={styles.newIconContainer}>
                        <Plus size={20} color="#0FBBA1" />
                    </View>
                    <Text style={styles.newCardText}>Take a new wellness check-in</Text>
                    <ChevronRight size={18} color="#0FBBA1" />
                </TouchableOpacity>

                {loading ? (
                    <ActivityIndicator size="large" color="#0FBBA1" style={{ marginTop: 40 }} />
                ) : assessments.length === 0 ? (
                    <Text style={styles.emptyText}>No wellness check-ins yet.</Text>
                ) : (
                    assessments.map((assessment) => {
                        const color = BUCKET_COLOR[assessment.overallBucket] ?? '#0FBBA1';
                        return (
                            <TouchableOpacity
                                key={assessment.id}
                                style={styles.card}
                                onPress={() => handleSelect(assessment)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.iconContainer}>
                                    <HeartPulse size={20} color="#0FBBA1" />
                                </View>
                                <View style={styles.cardContent}>
                                    <Text style={styles.cardTitle}>{formatDate(assessment.createdAt)}</Text>
                                    <Text style={styles.cardSubtitle}>
                                        {assessment.categories.length} categories checked
                                    </Text>
                                </View>
                                <View style={[styles.bucketPill, { backgroundColor: color + '1A' }]}>
                                    <Text style={[styles.bucketPillText, { color }]}>{assessment.overallBucket}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FE' },
    flexOne: { flex: 1 },
    // Same header recipe as the Family Members / Address Book screens -
    // white bar + shadow, plain icon back button, fontSize 20/600/#111827
    // title.
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 16,
        backgroundColor: '#fff',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
            android: { elevation: 2 },
        }),
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -8,
    },
    headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
    headerSpacer: { width: 40 },
    scrollContent: { padding: 20, flexGrow: 1 },
    newCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        marginBottom: 20,
        gap: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
    },
    newIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0FDFA',
        alignItems: 'center',
        justifyContent: 'center',
    },
    newCardText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#0FBBA1' },
    emptyText: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 20,
        textAlign: 'center',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0FDFA',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    cardContent: { flex: 1, marginRight: 8 },
    cardTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 2 },
    cardSubtitle: { fontSize: 12, color: '#6B7280' },
    bucketPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    bucketPillText: { fontSize: 12, fontWeight: '700' },
});
