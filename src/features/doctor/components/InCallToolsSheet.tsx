import { CheckCircle2, FileText, FlaskConical, Pill, X } from 'lucide-react-native';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
    visible: boolean;
    onClose: () => void;
    onOpenNotes: () => void;
    onOpenReports: () => void;
    // Chat has no separate "end call" button, so it needs its own way into
    // the end-of-consultation flow from this same sheet - the call screen
    // doesn't pass this, since it already has the hangup button for that.
    onComplete?: () => void;
}

// Notes / Prescription / Lab Test all open the same consultation-details
// form (it already combines all three into one write path) - this sheet just
// gives each its own clearly-labeled entry point rather than one generic
// "Notes" button, since that's what was asked for.
export default function InCallToolsSheet({ visible, onClose, onOpenNotes, onOpenReports, onComplete }: Props) {
    const insets = useSafeAreaInsets();

    const rows = [
        { key: 'notes', label: 'Diagnosis / Notes', Icon: FileText, onPress: onOpenNotes },
        { key: 'prescription', label: 'Prescription', Icon: Pill, onPress: onOpenNotes },
        { key: 'lab_test', label: 'Lab Tests', Icon: FlaskConical, onPress: onOpenNotes },
        { key: 'reports', label: 'Patient Reports', Icon: FileText, onPress: onOpenReports },
    ];

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
                <View style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Consultation Tools</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                    {rows.map((row) => (
                        <TouchableOpacity key={row.key} style={styles.row} onPress={row.onPress}>
                            <View style={styles.iconBox}>
                                <row.Icon size={20} color="#0FBBA1" />
                            </View>
                            <Text style={styles.rowLabel}>{row.label}</Text>
                        </TouchableOpacity>
                    ))}
                    {onComplete && (
                        <TouchableOpacity style={[styles.row, styles.completeRow]} onPress={onComplete}>
                            <View style={styles.iconBox}>
                                <CheckCircle2 size={20} color="#0FBBA1" />
                            </View>
                            <Text style={styles.rowLabel}>Complete Consultation</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
    content: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    title: { fontSize: 18, fontWeight: '700', color: '#111827' },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    completeRow: { borderBottomWidth: 0, marginTop: 4 },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    rowLabel: { fontSize: 15, fontWeight: '600', color: '#111827' },
});
