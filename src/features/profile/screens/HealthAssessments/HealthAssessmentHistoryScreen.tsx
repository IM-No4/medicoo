import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, ChevronRight, HeartPulse, Plus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color="#1F2937" />
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
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    flexOne: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        gap: 12,
    },
    backButton: { padding: 4 },
    headerTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#111827' },
    headerSpacer: { width: 24 },
    scrollContent: { padding: 20, flexGrow: 1 },
    newCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        backgroundColor: '#F0FDFA',
        borderWidth: 1,
        borderColor: '#0FBBA1',
        marginBottom: 20,
        gap: 12,
    },
    newIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
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
        padding: 14,
        borderRadius: 14,
        backgroundColor: '#F9FAFB',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
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
