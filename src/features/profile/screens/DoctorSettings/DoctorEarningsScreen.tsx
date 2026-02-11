import { StatusBar } from 'expo-status-bar';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Calendar, ChevronLeft, Landmark, ShieldCheck, TrendingUp, Wallet, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { executeAction } from '../../../../actions/ActionExecutor';
import StatusModal, { StatusType } from '../../../../components/modals/StatusModal';

const MOCK_TRANSACTIONS = [
    { id: '1', type: 'Consultation', sub: 'Patient: John Doe', amount: 500, date: 'Feb 04, 2026', status: 'Completed' },
    { id: '2', type: 'Follow-up', sub: 'Patient: Alice Smith', amount: 300, date: 'Feb 03, 2026', status: 'Completed' },
    { id: '3', type: 'Withdrawal', sub: 'To Bank: **** 4532', amount: -2500, date: 'Feb 01, 2026', status: 'Pending' },
    { id: '4', type: 'Consultation', sub: 'Patient: Robert Wilson', amount: 500, date: 'Jan 30, 2026', status: 'Completed' },
];

export default function DoctorEarningsScreen() {
    const insets = useSafeAreaInsets();
    const [activeFilter, setActiveFilter] = useState('All');
    const [hasPaymentProfile, setHasPaymentProfile] = useState(false);
    const [isSetupModalVisible, setIsSetupModalVisible] = useState(false);
    const [saving, setSaving] = useState(false);

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

    // Form State
    const [formData, setFormData] = useState({
        accountName: '',
        accountNumber: '',
        ifsc: '',
    });

    const filters = ['All', 'Credit', 'Debit'];

    const handleWithdraw = () => {
        if (!hasPaymentProfile) {
            setIsSetupModalVisible(true);
        } else {
            executeAction('OPEN_REDEEM');
        }
    };

    const handleSaveProfile = async () => {
        if (!formData.accountName || !formData.accountNumber || !formData.ifsc) {
            showStatus('error', 'Incomplete Details', 'Please fill all bank details to continue.');
            return;
        }

        setSaving(true);
        // Simulate API call to Razorpay through our backend
        setTimeout(() => {
            setSaving(false);
            setHasPaymentProfile(true);
            setIsSetupModalVisible(false);
            showStatus('success', 'Profile Created', 'Your details are securely stored. You can now withdraw your earnings.');
        }, 2000);
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => executeAction('GO_BACK')} style={styles.backButton}>
                    <ChevronLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Earnings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Main Balance Card */}
                <View style={styles.balanceContainer}>
                    <View style={styles.balanceCard}>
                        <View style={styles.balanceHeader}>
                            <View style={styles.walletIcon}>
                                <Wallet size={18} color="#fff" />
                            </View>
                            <Text style={styles.balanceLabel}>Available Balance</Text>
                        </View>
                        <Text style={styles.balanceValue}>₹12,450.00</Text>

                        <View style={styles.balanceFooter}>
                            <View style={styles.upcomingInfo}>
                                <Text style={styles.upcomingLabel}>Upcoming Settlement</Text>
                                <Text style={styles.upcomingValue}>₹3,200 (Scheduled for Friday)</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.withdrawBtn}
                                onPress={handleWithdraw}
                            >
                                <Text style={styles.withdrawText}>Withdraw</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Quick Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <View style={[styles.miniIcon, { backgroundColor: '#F0FDF4' }]}>
                            <TrendingUp size={16} color="#16A34A" />
                        </View>
                        <View>
                            <Text style={styles.statBoxLabel}>This Month</Text>
                            <Text style={styles.statBoxValue}>+₹4,200</Text>
                        </View>
                    </View>
                    <View style={styles.statBox}>
                        <View style={[styles.miniIcon, { backgroundColor: '#EFF6FF' }]}>
                            <Calendar size={16} color="#2563EB" />
                        </View>
                        <View>
                            <Text style={styles.statBoxLabel}>Settled</Text>
                            <Text style={styles.statBoxValue}>₹8,250</Text>
                        </View>
                    </View>
                </View>

                {/* Bank Account Shortcut */}
                <TouchableOpacity
                    style={styles.bankShortcut}
                    onPress={() => !hasPaymentProfile && setIsSetupModalVisible(true)}
                >
                    <View style={styles.bankInfo}>
                        <View style={styles.bankCircle}>
                            {hasPaymentProfile ? <Text style={styles.bankInitial}>H</Text> : <Landmark size={20} color="#6B7280" />}
                        </View>
                        <View>
                            <Text style={styles.bankName}>{hasPaymentProfile ? 'HDFC Bank Primary' : 'Setup Bank Account'}</Text>
                            <Text style={styles.bankAccount}>{hasPaymentProfile ? '**** 4532' : 'To receive payments'}</Text>
                        </View>
                    </View>
                    <ArrowRight size={18} color="#9CA3AF" />
                </TouchableOpacity>

                {/* Filters */}
                <View style={styles.filterSection}>
                    <Text style={styles.sectionTitle}>Transaction History</Text>
                    <View style={styles.filterRow}>
                        {filters.map(filter => (
                            <TouchableOpacity
                                key={filter}
                                onPress={() => setActiveFilter(filter)}
                                style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
                            >
                                <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>{filter}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.transactionList}>
                    {MOCK_TRANSACTIONS.map((tx) => (
                        <View key={tx.id} style={styles.transactionItem}>
                            <View style={styles.txLeft}>
                                <View style={[styles.txIcon, tx.amount > 0 ? styles.creditIcon : styles.debitIcon]}>
                                    {tx.amount > 0 ? <ArrowUpRight size={18} color="#16A34A" /> : <ArrowDownRight size={18} color="#DC2626" />}
                                </View>
                                <View>
                                    <Text style={styles.txType}>{tx.type}</Text>
                                    <Text style={styles.txSub}>{tx.sub}</Text>
                                </View>
                            </View>
                            <View style={styles.txRight}>
                                <Text style={[styles.txAmount, tx.amount < 0 && styles.debitText]}>
                                    {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount)}
                                </Text>
                                <Text style={styles.txDate}>{tx.date}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Setup Payment Profile Modal */}
            <Modal
                visible={isSetupModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsSetupModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.modalOverlay}
                >
                    <TouchableOpacity
                        style={styles.modalBlur}
                        activeOpacity={1}
                        onPress={() => setIsSetupModalVisible(false)}
                    />
                    <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Withdrawal Account</Text>
                            <TouchableOpacity onPress={() => setIsSetupModalVisible(false)} style={styles.closeBtn}>
                                <X size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>Please enter your bank details carefully to ensure smooth settlements.</Text>

                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Account Holder Name</Text>
                                <TextInput
                                    placeholder="as per bank records"
                                    style={styles.input}
                                    value={formData.accountName}
                                    onChangeText={(v) => setFormData(p => ({ ...p, accountName: v }))}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Account Number</Text>
                                <TextInput
                                    placeholder="Enter account number"
                                    style={styles.input}
                                    keyboardType="numeric"
                                    secureTextEntry={true}
                                    value={formData.accountNumber}
                                    onChangeText={(v) => setFormData(p => ({ ...p, accountNumber: v }))}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>IFSC Code</Text>
                                <TextInput
                                    placeholder="HDFC0001234"
                                    style={styles.input}
                                    autoCapitalize="characters"
                                    value={formData.ifsc}
                                    onChangeText={(v) => setFormData(p => ({ ...p, ifsc: v }))}
                                />
                            </View>

                            <View style={styles.securityBadge}>
                                <ShieldCheck size={16} color="#059669" />
                                <Text style={styles.securityText}>Your details are encrypted and securely stored on Razorpay.</Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                                onPress={handleSaveProfile}
                                disabled={saving}
                            >
                                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Verify & Create Profile</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
            <StatusModal
                visible={status.visible}
                status={status.type}
                title={status.title}
                message={status.message}
                onClose={() => setStatus(prev => ({ ...prev, visible: false }))}
                autoCloseDelay={status.type === 'success' ? 3000 : undefined}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    scrollContent: { paddingBottom: 40 },

    balanceContainer: { padding: 20 },
    balanceCard: {
        backgroundColor: '#111827',
        borderRadius: 24,
        padding: 24,
    },
    balanceHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    walletIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    balanceLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600' },
    balanceValue: { color: '#fff', fontSize: 36, fontWeight: '800', marginBottom: 24 },
    balanceFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)'
    },
    upcomingInfo: { flex: 1 },
    upcomingLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase' },
    upcomingValue: { fontSize: 13, color: '#fff', fontWeight: '500', marginTop: 2 },
    withdrawBtn: {
        backgroundColor: '#2FA561',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 10,
        alignItems: 'center'
    },
    withdrawText: { color: '#fff', fontWeight: '700', fontSize: 13 },

    statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
    statBox: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    miniIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    statBoxLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' },
    statBoxValue: { fontSize: 16, fontWeight: '800', color: '#111827', marginTop: 1 },

    bankShortcut: {
        marginHorizontal: 20,
        marginBottom: 24,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    bankInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    bankCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
    bankInitial: { fontSize: 16, fontWeight: '700', color: '#6B7280' },
    bankName: { fontSize: 14, fontWeight: '600', color: '#111827' },
    bankAccount: { fontSize: 12, color: '#9CA3AF' },

    filterSection: { paddingHorizontal: 20, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
    filterRow: { flexDirection: 'row', gap: 8 },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    filterChipActive: {
        backgroundColor: '#111827',
        borderColor: '#111827'
    },
    filterText: { fontSize: 12, color: '#6B7280', fontWeight: '700' },
    filterTextActive: { color: '#fff' },

    transactionList: { paddingHorizontal: 20, gap: 12 },
    transactionItem: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    txLeft: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    txIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    creditIcon: { backgroundColor: '#F0FDF4' },
    debitIcon: { backgroundColor: '#FEF2F2' },
    txType: { fontSize: 14, fontWeight: '600', color: '#111827' },
    txSub: { fontSize: 12, color: '#9CA3AF' },
    txRight: { alignItems: 'flex-end' },
    txAmount: { fontSize: 15, fontWeight: '700', color: '#16A34A' },
    debitText: { color: '#DC2626' },
    txDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

    // Modal Styles
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalBlur: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '90%'
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
    modalSubtitle: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 24 },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },

    form: { gap: 16 },
    inputGroup: { gap: 8 },
    label: { fontSize: 13, fontWeight: '700', color: '#374151' },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#111827'
    },
    securityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#F0FDF4',
        padding: 12,
        borderRadius: 12,
        marginTop: 8
    },
    securityText: { fontSize: 12, color: '#065F46', fontWeight: '500', flex: 1 },
    saveBtn: {
        backgroundColor: '#111827',
        borderRadius: 14,
        padding: 18,
        alignItems: 'center',
        marginTop: 8
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
