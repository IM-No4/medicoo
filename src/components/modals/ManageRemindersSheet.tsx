import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Target, Pill, ChevronRight } from 'lucide-react-native';

interface ManageRemindersSheetProps {
    visible: boolean;
    onClose: () => void;
    onGoToGoals: () => void;
    onGoToMedications: () => void;
}

export default function ManageRemindersSheet({
    visible,
    onClose,
    onGoToGoals,
    onGoToMedications,
}: ManageRemindersSheetProps) {
    const insets = useSafeAreaInsets();
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            {/* Backdrop and sheet must share one wrapping view - as separate
                top-level siblings, the native modal window's own opaque
                background shows through right at the sheet's rounded
                corners, making them look squared off instead of rounded. */}
            <View style={styles.backdrop}>
                <Pressable style={styles.backdropTouchable} onPress={onClose} />
                <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + 8, 24) }]}>
                    {/* Handle */}
                    <View style={styles.handle} />

                    <Text style={styles.title}>Manage Reminders</Text>
                    <Text style={styles.subtitle}>Select a category to manage</Text>

                    <View style={styles.options}>
                        <TouchableOpacity
                            style={styles.optionRow}
                            activeOpacity={0.7}
                            onPress={() => {
                                onClose();
                                onGoToMedications();
                            }}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: '#F0FDF4' }]}>
                                <Pill size={22} color="#2FA561" />
                            </View>
                            <View style={styles.optionText}>
                                <Text style={styles.optionTitle}>Medications</Text>
                                <Text style={styles.optionDesc}>Pause, delete or add new medications</Text>
                            </View>
                            <ChevronRight size={20} color="#CBD5E1" />
                        </TouchableOpacity>

                        <View style={styles.separator} />

                        <TouchableOpacity
                            style={styles.optionRow}
                            activeOpacity={0.7}
                            onPress={() => {
                                onClose();
                                onGoToGoals();
                            }}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: '#EFF6FF' }]}>
                                <Target size={22} color="#3B82F6" />
                            </View>
                            <View style={styles.optionText}>
                                <Text style={styles.optionTitle}>Goals</Text>
                                <Text style={styles.optionDesc}>Pause, delete or add new daily habits</Text>
                            </View>
                            <ChevronRight size={20} color="#CBD5E1" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'flex-end',
    },
    backdropTouchable: {
        flex: 1,
    },
    sheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingTop: 12,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 10,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E2E8F0',
        alignSelf: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 20,
    },
    options: {
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
        marginBottom: 16,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 14,
    },
    separator: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginHorizontal: 16,
    },
    optionIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionText: {
        flex: 1,
        gap: 2,
    },
    optionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
    },
    optionDesc: {
        fontSize: 12,
        color: '#64748B',
    },
    cancelBtn: {
        backgroundColor: '#F1F5F9',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#475569',
    },
});
