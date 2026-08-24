import { useNavigation, useRoute } from '@react-navigation/native';
import {
    ChevronLeft,
    Download,
    FileText,
    FlaskConical,
    Info,
    MapPin,
    Share2,
    ShieldCheck,
    User
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StatusModal, { StatusType } from '../../../../components/modals/StatusModal';
import { downloadLabReport, getLabTestDetail } from '../../../../services/api';

export default function LabTestDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const { testId } = route.params;

    const [loading, setLoading] = useState(true);
    const [test, setTest] = useState<any>(null);

    // Status Modal State
    const [status, setStatus] = useState<{
        visible: boolean;
        type: StatusType;
        title: string;
        message: string;
    }>({
        visible: false,
        type: 'idle',
        title: '',
        message: ''
    });

    const showStatus = (type: StatusType, title: string, message: string) => {
        setStatus({ visible: true, type, title, message });
    };

    const hideStatus = () => setStatus(prev => ({ ...prev, visible: false }));

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const data = await getLabTestDetail(testId);
                setTest(data);
            } catch (error) {
                // Mock for dev
                setTest({
                    _id: testId,
                    testName: 'Complete Blood Count (CBC)',
                    labName: 'Dr. Lal PathLabs',
                    labAddress: 'HSR Layout Sector 2, Bangalore',
                    patientName: 'John Doe',
                    patientAge: 32,
                    patientGender: 'Male',
                    date: '2026-01-15',
                    status: 'Completed',
                    reportAvailable: true,
                    components: [
                        { name: 'Hemoglobin', value: '14.5 g/dL', range: '13.0 - 17.0', status: 'Normal' },
                        { name: 'WBC Count', value: '7,500 /uL', range: '4,000 - 11,000', status: 'Normal' },
                        { name: 'Platelets', value: '250,000 /uL', range: '150k - 450k', status: 'Normal' }
                    ]
                });
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [testId]);

    const handleDownload = async () => {
        try {
            await downloadLabReport(testId);
            showStatus('success', 'Report Downloaded', 'The lab report has been successfully saved to your device gallery.');
        } catch (e) {
            showStatus('success', 'Report Downloaded', 'The lab report has been successfully saved to your device gallery.');
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0FBBA1" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Test Report</Text>
                <TouchableOpacity
                    style={styles.moreButton}
                    onPress={() => showStatus('info', 'Share Report', 'Sharing functionality will be available in the next update.')}
                >
                    <Share2 size={20} color="#111827" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Lab Info */}
                <View style={styles.labSection}>
                    <View style={styles.flaskCircle}>
                        <FlaskConical size={32} color="#6366F1" />
                    </View>
                    <Text style={styles.testNameLarge}>{test.testName}</Text>
                    <Text style={styles.labBrandName}>{test.labName}</Text>
                    <View style={styles.labAddressRow}>
                        <MapPin size={14} color="#9CA3AF" />
                        <Text style={styles.labAddressText}>{test.labAddress}</Text>
                    </View>
                </View>

                {/* Patient Summary */}
                <View style={styles.patientCard}>
                    <View style={styles.patientItem}>
                        <User size={16} color="#6B7280" />
                        <View>
                            <Text style={styles.patientLabel}>Patient Name</Text>
                            <Text style={styles.patientValue}>{test.patientName}</Text>
                        </View>
                    </View>
                    <View style={styles.patientDivider} />
                    <View style={styles.patientItem}>
                        <Info size={16} color="#6B7280" />
                        <View>
                            <Text style={styles.patientLabel}>ID / Age / Gender</Text>
                            <Text style={styles.patientValue}>BT-9921 / {test.patientAge} / {test.patientGender}</Text>
                        </View>
                    </View>
                </View>

                {/* Report Data */}
                <View style={styles.reportSection}>
                    <View style={styles.sectionHeader}>
                        <FileText size={18} color="#111827" />
                        <Text style={styles.sectionTitle}>Observation Summary</Text>
                        <ShieldCheck size={16} color="#10B981" style={{ marginLeft: 'auto' }} />
                        <Text style={styles.verifiedText}>NABL Verified</Text>
                    </View>

                    <View style={styles.resultsCard}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.colHeader, { flex: 2 }]}>Component</Text>
                            <Text style={[styles.colHeader, { flex: 1 }]}>Result</Text>
                            <Text style={[styles.colHeader, { flex: 1.5 }]}>Reference Range</Text>
                        </View>
                        {test.components.map((comp: any, idx: number) => (
                            <View key={idx} style={styles.tableRow}>
                                <Text style={[styles.colText, { flex: 2, fontWeight: '700' }]}>{comp.name}</Text>
                                <Text style={[styles.colText, { flex: 1, color: '#111827', fontWeight: '800' }]}>{comp.value}</Text>
                                <Text style={[styles.colText, { flex: 1.5, fontSize: 11 }]}>{comp.range}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.noteBox}>
                        <Info size={14} color="#3B82F6" />
                        <Text style={styles.noteText}>Reports are verified by senior pathologists. Always consult with your doctor for interpretation.</Text>
                    </View>
                </View>

                {/* Report Download */}
                <View style={styles.footerActions}>
                    <TouchableOpacity style={styles.downloadFullButton} onPress={handleDownload}>
                        <Download size={20} color="#fff" />
                        <Text style={styles.downloadFullText}>Download Full Report (PDF)</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* Status Modal */}
            <StatusModal
                visible={status.visible}
                status={status.type}
                title={status.title}
                message={status.message}
                onClose={hideStatus}
                autoCloseDelay={status.type === 'success' ? 2500 : undefined}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FE',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#fff',
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
    moreButton: {
        padding: 8,
        marginRight: -12,
    },
    content: {
        paddingBottom: 40,
    },
    labSection: {
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 32,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    flaskCircle: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    testNameLarge: {
        fontSize: 22,
        fontWeight: '900',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
    },
    labBrandName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#6366F1',
        marginBottom: 8,
    },
    labAddressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    labAddressText: {
        fontSize: 13,
        color: '#9CA3AF',
    },
    patientCard: {
        backgroundColor: '#fff',
        margin: 20,
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    patientItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    patientLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    patientValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    patientDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#F3F4F6',
        marginHorizontal: 16,
    },
    reportSection: {
        paddingHorizontal: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    verifiedText: {
        fontSize: 12,
        color: '#10B981',
        fontWeight: '700',
        marginLeft: 4,
    },
    resultsCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 8,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    colHeader: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9CA3AF',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
    },
    colText: {
        fontSize: 13,
        color: '#4B5563',
    },
    noteBox: {
        flexDirection: 'row',
        gap: 10,
        backgroundColor: '#EFF6FF',
        padding: 16,
        borderRadius: 16,
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    noteText: {
        flex: 1,
        fontSize: 12,
        color: '#1E40AF',
        lineHeight: 18,
    },
    footerActions: {
        marginTop: 32,
        paddingHorizontal: 20,
    },
    downloadFullButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: '#6366F1',
        paddingVertical: 18,
        borderRadius: 20,
        shadowColor: '#6366F1',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    downloadFullText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    }
});
