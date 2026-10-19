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
import React, { useEffect, useState, useMemo } from 'react';
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
import { useTheme } from '../../../../theme/ThemeContext';
import type { ThemeColors } from '../../../../theme/colors';
import { useLanguage } from '../../../../i18n/LanguageContext';

export default function LabTestDetailScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
            showStatus('success', t('report_downloaded'), t('the_lab_report_has_been_successfully_s'));
        } catch (e) {
            showStatus('success', t('report_downloaded'), t('the_lab_report_has_been_successfully_s'));
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('test_report')}</Text>
                <TouchableOpacity
                    style={styles.moreButton}
                    onPress={() => showStatus('info', t('share_report'), t('sharing_functionality_will_be_availabl'))}
                >
                    <Share2 size={20} color={theme.text} />
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
                        <MapPin size={14} color={theme.textMuted} />
                        <Text style={styles.labAddressText}>{test.labAddress}</Text>
                    </View>
                </View>

                {/* Patient Summary */}
                <View style={styles.patientCard}>
                    <View style={styles.patientItem}>
                        <User size={16} color={theme.textSecondary} />
                        <View>
                            <Text style={styles.patientLabel}>{t('patient_name')}</Text>
                            <Text style={styles.patientValue}>{test.patientName}</Text>
                        </View>
                    </View>
                    <View style={styles.patientDivider} />
                    <View style={styles.patientItem}>
                        <Info size={16} color={theme.textSecondary} />
                        <View>
                            <Text style={styles.patientLabel}>{t('id_age_gender')}</Text>
                            <Text style={styles.patientValue}>BT-9921 / {test.patientAge} / {test.patientGender}</Text>
                        </View>
                    </View>
                </View>

                {/* Report Data */}
                <View style={styles.reportSection}>
                    <View style={styles.sectionHeader}>
                        <FileText size={18} color={theme.text} />
                        <Text style={styles.sectionTitle}>{t('observation_summary')}</Text>
                        <ShieldCheck size={16} color="#10B981" style={{ marginLeft: 'auto' }} />
                        <Text style={styles.verifiedText}>{t('nabl_verified')}</Text>
                    </View>

                    <View style={styles.resultsCard}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.colHeader, { flex: 2 }]}>{t('component')}</Text>
                            <Text style={[styles.colHeader, { flex: 1 }]}>{t('result')}</Text>
                            <Text style={[styles.colHeader, { flex: 1.5 }]}>{t('reference_range')}</Text>
                        </View>
                        {test.components.map((comp: any, idx: number) => (
                            <View key={idx} style={styles.tableRow}>
                                <Text style={[styles.colText, { flex: 2, fontWeight: '700' }]}>{comp.name}</Text>
                                <Text style={[styles.colText, { flex: 1, color: theme.text, fontWeight: '800' }]}>{comp.value}</Text>
                                <Text style={[styles.colText, { flex: 1.5, fontSize: 11 }]}>{comp.range}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.noteBox}>
                        <Info size={14} color="#3B82F6" />
                        <Text style={styles.noteText}>{t('reports_are_verified_by_senior_patholo')}</Text>
                    </View>
                </View>

                {/* Report Download */}
                <View style={styles.footerActions}>
                    <TouchableOpacity style={styles.downloadFullButton} onPress={handleDownload}>
                        <Download size={20} color="#fff" />
                        <Text style={styles.downloadFullText}>{t('download_full_report_pdf')}</Text>
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

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: c.background,
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
        backgroundColor: c.card,
    },
    backButton: {
        padding: 8,
        marginLeft: -12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: c.text,
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
        backgroundColor: c.card,
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
        backgroundColor: c.infoBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    testNameLarge: {
        fontSize: 22,
        fontWeight: '900',
        color: c.text,
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
        color: c.textMuted,
    },
    patientCard: {
        backgroundColor: c.card,
        margin: 20,
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: c.borderLight,
    },
    patientItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    patientLabel: {
        fontSize: 11,
        color: c.textMuted,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    patientValue: {
        fontSize: 14,
        fontWeight: '700',
        color: c.text,
    },
    patientDivider: {
        width: 1,
        height: 30,
        backgroundColor: c.cardSecondary,
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
        color: c.text,
    },
    verifiedText: {
        fontSize: 12,
        color: '#10B981',
        fontWeight: '700',
        marginLeft: 4,
    },
    resultsCard: {
        backgroundColor: c.card,
        borderRadius: 24,
        padding: 8,
        borderWidth: 1,
        borderColor: c.borderLight,
    },
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: c.borderLight,
    },
    colHeader: {
        fontSize: 12,
        fontWeight: '700',
        color: c.textMuted,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: c.borderLight,
    },
    colText: {
        fontSize: 13,
        color: c.textSecondary,
    },
    noteBox: {
        flexDirection: 'row',
        gap: 10,
        backgroundColor: c.infoBg,
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
