import { Plus, Search, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchLabTests, fetchMedicines, PrescribedLabTestInput, PrescribedMedicineInput } from '../../../services/api/doctor.api';

export type ConsultationDraft = {
    notes: string;
    prescribedMedicines: PrescribedMedicineInput[];
    prescribedLabTests: PrescribedLabTestInput[];
};

interface Props {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: ConsultationDraft) => Promise<void>;
    // 'draft' opens the same form mid-call without ending the consultation -
    // it hands the entered data back to the caller (to be held locally and
    // resubmitted, pre-filled, through the 'complete' flow at hangup) instead
    // of finalizing anything itself.
    mode?: 'complete' | 'draft';
    initialData?: ConsultationDraft;
    onSaveDraft?: (data: ConsultationDraft) => void;
}

export default function ConsultationDetailsModal({ visible, onClose, onSubmit, mode = 'complete', initialData, onSaveDraft }: Props) {
    const insets = useSafeAreaInsets();
    const [submitting, setSubmitting] = useState(false);
    const [notes, setNotes] = useState('');
    const [medicines, setMedicines] = useState<PrescribedMedicineInput[]>([]);
    const [labTests, setLabTests] = useState<PrescribedLabTestInput[]>([]);

    const [addingMedicine, setAddingMedicine] = useState(false);
    const [addingLabTest, setAddingLabTest] = useState(false);

    useEffect(() => {
        if (visible) {
            setNotes(initialData?.notes ?? '');
            setMedicines(initialData?.prescribedMedicines ?? []);
            setLabTests(initialData?.prescribedLabTests ?? []);
            setAddingMedicine(false);
            setAddingLabTest(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await onSubmit({ notes, prescribedMedicines: medicines, prescribedLabTests: labTests });
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveDraft = () => {
        onSaveDraft?.({ notes, prescribedMedicines: medicines, prescribedLabTests: labTests });
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
                <View style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{mode === 'draft' ? 'Consultation Notes' : 'Complete Consultation'}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.subtitle}>
                        {mode === 'draft'
                            ? 'Add a diagnosis, prescription, or lab tests during the call - you can keep editing this until you complete the consultation.'
                            : 'Add a diagnosis, prescription, or lab tests for the patient - or skip and complete anyway.'}
                    </Text>

                    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        <Text style={styles.sectionLabel}>Diagnosis / Notes</Text>
                        <TextInput
                            style={styles.notesInput}
                            placeholder="e.g. Seasonal allergy, mild. Advised rest and hydration."
                            placeholderTextColor="#9CA3AF"
                            multiline
                            value={notes}
                            onChangeText={setNotes}
                        />

                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionLabel}>Prescribed Medicines</Text>
                            {!addingMedicine && (
                                <TouchableOpacity style={styles.addChip} onPress={() => setAddingMedicine(true)}>
                                    <Plus size={14} color="#2FA561" />
                                    <Text style={styles.addChipText}>Add</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {medicines.map((med, index) => (
                            <View key={`${med.medicineSku}-${index}`} style={styles.itemCard}>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemTitle}>{med.medicineName}</Text>
                                    <Text style={styles.itemSub}>{med.intakeDetails.dosage} · {med.intakeDetails.period}</Text>
                                </View>
                                <TouchableOpacity onPress={() => setMedicines(prev => prev.filter((_, i) => i !== index))}>
                                    <X size={16} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        {addingMedicine && (
                            <AddMedicineForm
                                onCancel={() => setAddingMedicine(false)}
                                onAdd={(med) => {
                                    setMedicines(prev => [...prev, med]);
                                    setAddingMedicine(false);
                                }}
                            />
                        )}

                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionLabel}>Recommended Lab Tests</Text>
                            {!addingLabTest && (
                                <TouchableOpacity style={styles.addChip} onPress={() => setAddingLabTest(true)}>
                                    <Plus size={14} color="#2FA561" />
                                    <Text style={styles.addChipText}>Add</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {labTests.map((test, index) => (
                            <View key={`${test.testName}-${index}`} style={styles.itemCard}>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemTitle}>{test.testName}</Text>
                                    {!!test.additionalDetails && <Text style={styles.itemSub}>{test.additionalDetails}</Text>}
                                </View>
                                <TouchableOpacity onPress={() => setLabTests(prev => prev.filter((_, i) => i !== index))}>
                                    <X size={16} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        {addingLabTest && (
                            <AddLabTestForm
                                onCancel={() => setAddingLabTest(false)}
                                onAdd={(test) => {
                                    setLabTests(prev => [...prev, test]);
                                    setAddingLabTest(false);
                                }}
                            />
                        )}
                    </ScrollView>

                    {mode === 'draft' ? (
                        <TouchableOpacity style={styles.submitButton} onPress={handleSaveDraft}>
                            <Text style={styles.submitButtonText}>Save</Text>
                        </TouchableOpacity>
                    ) : (
                        <>
                            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
                                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Save & Complete Consultation</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.skipButton} onPress={handleSubmit} disabled={submitting}>
                                <Text style={styles.skipButtonText}>Skip & Complete</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

function AddMedicineForm({ onAdd, onCancel }: {
    onAdd: (med: PrescribedMedicineInput) => void;
    onCancel: () => void;
}) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Array<{ sku: number; productName: string; brand: string }>>([]);
    const [searching, setSearching] = useState(false);
    const [selected, setSelected] = useState<{ sku: number; productName: string } | null>(null);
    const [dosage, setDosage] = useState('');
    const [period, setPeriod] = useState('');
    const [instructions, setInstructions] = useState('');

    useEffect(() => {
        if (selected || query.trim().length < 2) {
            setResults([]);
            return;
        }
        setSearching(true);
        const timer = setTimeout(async () => {
            try {
                const data = await fetchMedicines(query.trim());
                setResults(data);
            } catch (error) {
                console.warn('Medicine search failed:', error);
            } finally {
                setSearching(false);
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [query, selected]);

    if (!selected) {
        return (
            <View style={styles.inlineForm}>
                <View style={styles.searchRow}>
                    <Search size={16} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search medicine by name"
                        placeholderTextColor="#9CA3AF"
                        value={query}
                        onChangeText={setQuery}
                        autoFocus
                    />
                    {searching && <ActivityIndicator size="small" color="#2FA561" />}
                </View>
                {results.map((r) => (
                    <TouchableOpacity
                        key={r.sku}
                        style={styles.resultRow}
                        onPress={() => setSelected({ sku: r.sku, productName: r.productName })}
                    >
                        <Text style={styles.resultTitle}>{r.productName}</Text>
                        <Text style={styles.resultSub}>{r.brand}</Text>
                    </TouchableOpacity>
                ))}
                {query.trim().length >= 2 && !searching && results.length === 0 && (
                    <Text style={styles.noResultsText}>No medicines found.</Text>
                )}
                <TouchableOpacity style={styles.cancelInlineBtn} onPress={onCancel}>
                    <Text style={styles.cancelInlineText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.inlineForm}>
            <Text style={styles.selectedTitle}>{selected.productName}</Text>
            <TextInput
                style={styles.smallInput}
                placeholder="Dosage (e.g. 10mg, 1 tablet)"
                placeholderTextColor="#9CA3AF"
                value={dosage}
                onChangeText={setDosage}
            />
            <TextInput
                style={styles.smallInput}
                placeholder="Frequency / duration (e.g. Twice daily, 5 days)"
                placeholderTextColor="#9CA3AF"
                value={period}
                onChangeText={setPeriod}
            />
            <TextInput
                style={styles.smallInput}
                placeholder="Instructions (optional, e.g. after food)"
                placeholderTextColor="#9CA3AF"
                value={instructions}
                onChangeText={setInstructions}
            />
            <View style={styles.inlineButtonRow}>
                <TouchableOpacity style={styles.cancelInlineBtn} onPress={onCancel}>
                    <Text style={styles.cancelInlineText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.addInlineBtn, !dosage.trim() && styles.addInlineBtnDisabled]}
                    disabled={!dosage.trim()}
                    onPress={() => onAdd({
                        medicineSku: selected.sku,
                        medicineName: selected.productName,
                        intakeDetails: {
                            dosage: dosage.trim(),
                            period: period.trim(),
                            instructions: instructions.trim() ? [instructions.trim()] : [],
                        },
                    })}
                >
                    <Text style={styles.addInlineText}>Add</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function AddLabTestForm({ onAdd, onCancel }: {
    onAdd: (test: PrescribedLabTestInput) => void;
    onCancel: () => void;
}) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Array<{ testName: string }>>([]);
    const [searching, setSearching] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const [additionalDetails, setAdditionalDetails] = useState('');

    useEffect(() => {
        if (selected || query.trim().length < 2) {
            setResults([]);
            return;
        }
        setSearching(true);
        const timer = setTimeout(async () => {
            try {
                const data = await fetchLabTests(query.trim());
                setResults(data);
            } catch (error) {
                console.warn('Lab test search failed:', error);
            } finally {
                setSearching(false);
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [query, selected]);

    if (!selected) {
        return (
            <View style={styles.inlineForm}>
                <View style={styles.searchRow}>
                    <Search size={16} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search lab test by name"
                        placeholderTextColor="#9CA3AF"
                        value={query}
                        onChangeText={setQuery}
                        autoFocus
                    />
                    {searching && <ActivityIndicator size="small" color="#2FA561" />}
                </View>
                {results.map((r) => (
                    <TouchableOpacity key={r.testName} style={styles.resultRow} onPress={() => setSelected(r.testName)}>
                        <Text style={styles.resultTitle}>{r.testName}</Text>
                    </TouchableOpacity>
                ))}
                {query.trim().length >= 2 && !searching && results.length === 0 && (
                    <Text style={styles.noResultsText}>No lab tests found.</Text>
                )}
                <TouchableOpacity style={styles.cancelInlineBtn} onPress={onCancel}>
                    <Text style={styles.cancelInlineText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.inlineForm}>
            <Text style={styles.selectedTitle}>{selected}</Text>
            <TextInput
                style={styles.smallInput}
                placeholder="Notes (optional)"
                placeholderTextColor="#9CA3AF"
                value={additionalDetails}
                onChangeText={setAdditionalDetails}
            />
            <View style={styles.inlineButtonRow}>
                <TouchableOpacity style={styles.cancelInlineBtn} onPress={onCancel}>
                    <Text style={styles.cancelInlineText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.addInlineBtn}
                    onPress={() => onAdd({ testName: selected, additionalDetails: additionalDetails.trim() })}
                >
                    <Text style={styles.addInlineText}>Add</Text>
                </TouchableOpacity>
            </View>
        </View>
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
        maxHeight: '88%',
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 18, fontWeight: '700', color: '#111827' },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
    subtitle: { fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 16, lineHeight: 18 },
    scroll: { flexGrow: 0 },
    sectionLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase' },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10 },
    notesInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 14,
        fontSize: 14,
        color: '#111827',
        minHeight: 80,
        textAlignVertical: 'top',
        marginTop: 8,
    },
    addChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F0FDF4',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    addChipText: { color: '#2FA561', fontSize: 12, fontWeight: '700' },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    itemInfo: { flex: 1, marginRight: 8 },
    itemTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
    itemSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    inlineForm: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        gap: 8,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    searchInput: { flex: 1, fontSize: 14, color: '#111827' },
    resultRow: { paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    resultTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
    resultSub: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
    noResultsText: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', paddingVertical: 8 },
    selectedTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
    smallInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        color: '#111827',
    },
    inlineButtonRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
    cancelInlineBtn: { flex: 1, alignItems: 'center', paddingVertical: 10 },
    cancelInlineText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
    addInlineBtn: { flex: 1, backgroundColor: '#2FA561', borderRadius: 10, alignItems: 'center', paddingVertical: 10 },
    addInlineBtnDisabled: { backgroundColor: '#A7D6BB' },
    addInlineText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    submitButton: {
        backgroundColor: '#2FA561',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 16,
    },
    submitButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    skipButton: { alignItems: 'center', paddingVertical: 12 },
    skipButtonText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },
});
